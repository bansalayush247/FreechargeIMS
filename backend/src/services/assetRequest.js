const mongoose = require("mongoose");

const AssetRequest = require("../models/assetRequest");
const AssetRequestApproval = require("../models/assetRequestApproval");
const WorkflowDefinition = require("../models/workflowDefinition");
const WorkflowInstance = require("../models/workflowInstance");
const Space = require("../models/space");
const Product = require("../models/product");
const Merchant = require("../models/merchant");
const InventoryItem = require("../models/inventory");
const InventoryStock = require("../models/inventoryStock");

const assetRequestRepository = require("../repositories/assetRequest");
const assetRequestApprovalRepository = require("../repositories/assetRequestApproval");
const assetRegistryRepository = require("../repositories/assetRegistry");
const inventoryTransactionRepository = require("../repositories/inventoryTransaction");
const inventoryTransactionService = require("./inventoryTransaction");
const notificationService = require("./notification");

const {
  ASSET_REQUEST_STATUS,
  ASSET_REQUEST_TYPE,
  ASSET_REQUEST_STEP_KEYS,
  ASSET_REQUEST_APPROVAL_ACTIONS,
  normalizeAssetRequestStatus,
} = require("../constants/assetRequest");
const { INVENTORY_STATUS } = require("../constants/inventory");
const { INVENTORY_TRANSACTION_TYPES } = require("../constants/inventoryTransaction");
const { NOTIFICATION_TYPES } = require("../constants/notification");
const { PRODUCT_TRACKING_TYPES } = require("../constants/product");
const { WORKFLOW_ENTITY_TYPES, WORKFLOW_STATUS, WORKFLOW_ACTIONS } = require("../constants/workflow");

const AppError = require("../utils/appError");

const TRANSACTION_UNSUPPORTED_ERROR_MESSAGE =
  "Transaction numbers are only allowed on a replica set member or mongos";

const isTransactionUnsupportedError = (error) =>
  Boolean(error?.message?.includes(TRANSACTION_UNSUPPORTED_ERROR_MESSAGE));

const STEP_TO_STATUS = {
  [ASSET_REQUEST_STEP_KEYS.MANAGER_APPROVAL]: ASSET_REQUEST_STATUS.PENDING_MANAGER,
  [ASSET_REQUEST_STEP_KEYS.IT_APPROVAL]: ASSET_REQUEST_STATUS.PENDING_IT,
  [ASSET_REQUEST_STEP_KEYS.ZONAL_APPROVAL]: ASSET_REQUEST_STATUS.PENDING_ZONAL,
  [ASSET_REQUEST_STEP_KEYS.ZONAL_MANAGER_APPROVAL]: ASSET_REQUEST_STATUS.PENDING_ZONAL,
  [ASSET_REQUEST_STEP_KEYS.FULFILLMENT]: ASSET_REQUEST_STATUS.PENDING_FULFILLMENT,
  [ASSET_REQUEST_STEP_KEYS.WAREHOUSE_FULFILLMENT]: ASSET_REQUEST_STATUS.PENDING_FULFILLMENT,
};

const TERMINAL_STATUSES = [
  ASSET_REQUEST_STATUS.CANCELLED,
  ASSET_REQUEST_STATUS.REJECTED,
  ASSET_REQUEST_STATUS.FULFILLED,
  ASSET_REQUEST_STATUS.PARTIALLY_FULFILLED,
  ASSET_REQUEST_STATUS.OUT_OF_STOCK,
  ASSET_REQUEST_STATUS.PROCUREMENT_REQUIRED,
];

const FULFILLABLE_STATUSES = [
  ASSET_REQUEST_STATUS.PENDING_FULFILLMENT,
  ASSET_REQUEST_STATUS.FULFILLMENT_DELAYED,
];

const DEFAULT_WORKFLOWS = {
  [ASSET_REQUEST_TYPE.EMPLOYEE_ASSET]: {
    code: "EMPLOYEE_ASSET_REQUEST",
    name: "Employee Asset Workflow",
    steps: [
      { stepKey: ASSET_REQUEST_STEP_KEYS.MANAGER_APPROVAL, name: "Manager Approval", order: 1, allowedActions: [WORKFLOW_ACTIONS.APPROVE, WORKFLOW_ACTIONS.REJECT], nextStepKey: ASSET_REQUEST_STEP_KEYS.IT_APPROVAL },
      { stepKey: ASSET_REQUEST_STEP_KEYS.IT_APPROVAL, name: "IT Approval", order: 2, allowedActions: [WORKFLOW_ACTIONS.APPROVE, WORKFLOW_ACTIONS.REJECT], nextStepKey: ASSET_REQUEST_STEP_KEYS.FULFILLMENT },
      { stepKey: ASSET_REQUEST_STEP_KEYS.FULFILLMENT, name: "Fulfillment", order: 3, allowedActions: [WORKFLOW_ACTIONS.COMPLETE, WORKFLOW_ACTIONS.REJECT], nextStepKey: "" },
    ],
  },
  [ASSET_REQUEST_TYPE.MERCHANT_ASSET]: {
    code: "MERCHANT_ASSET_REQUEST",
    name: "Merchant Asset Workflow",
    steps: [
      { stepKey: ASSET_REQUEST_STEP_KEYS.MANAGER_APPROVAL, name: "Manager Approval", order: 1, allowedActions: [WORKFLOW_ACTIONS.APPROVE, WORKFLOW_ACTIONS.REJECT], nextStepKey: ASSET_REQUEST_STEP_KEYS.ZONAL_APPROVAL },
      { stepKey: ASSET_REQUEST_STEP_KEYS.ZONAL_APPROVAL, name: "Zonal Approval", order: 2, allowedActions: [WORKFLOW_ACTIONS.APPROVE, WORKFLOW_ACTIONS.REJECT], nextStepKey: ASSET_REQUEST_STEP_KEYS.FULFILLMENT },
      { stepKey: ASSET_REQUEST_STEP_KEYS.FULFILLMENT, name: "Fulfillment", order: 3, allowedActions: [WORKFLOW_ACTIONS.COMPLETE, WORKFLOW_ACTIONS.REJECT], nextStepKey: "" },
    ],
  },
};

const normalizeStepKey = (stepKey) => {
  if (stepKey === "WAREHOUSE_FULFILLMENT") return ASSET_REQUEST_STEP_KEYS.FULFILLMENT;
  if (stepKey === "ZONAL_MANAGER_APPROVAL") return ASSET_REQUEST_STEP_KEYS.ZONAL_APPROVAL;
  return stepKey;
};

const generateRequestNumber = async () => {
  const count = await AssetRequest.countDocuments();
  return `AR-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
};

const ensureWorkflowDefinition = async (spaceId, requestType, userId) => {
  const preset = DEFAULT_WORKFLOWS[requestType];
  if (!preset) throw new AppError("Unsupported request type", 400);

  const space = await Space.findOne({ _id: spaceId, isDeleted: false }).select("employeeWorkflowDefinitionId merchantWorkflowDefinitionId").lean();
  const configuredDefinitionId = requestType === ASSET_REQUEST_TYPE.MERCHANT_ASSET
    ? space?.merchantWorkflowDefinitionId
    : space?.employeeWorkflowDefinitionId;

  if (configuredDefinitionId) {
    const configuredDefinition = await WorkflowDefinition.findOne({
      _id: configuredDefinitionId,
      spaceId,
      entityType: WORKFLOW_ENTITY_TYPES.ASSET_REQUEST,
      isActive: true,
      isDeleted: false,
    }).lean();

    if (!configuredDefinition) throw new AppError("Configured asset request workflow is unavailable", 400);
    if (configuredDefinition.steps.some((step) => !STEP_TO_STATUS[normalizeStepKey(step.stepKey)])) {
      throw new AppError("Configured asset request workflow contains unsupported steps", 400);
    }
    return configuredDefinition;
  }

  let definition = await WorkflowDefinition.findOne({ spaceId, code: preset.code, isDeleted: false }).lean();
  if (definition) return definition;

  const created = await WorkflowDefinition.create({
    spaceId,
    code: preset.code,
    name: preset.name,
    entityType: WORKFLOW_ENTITY_TYPES.ASSET_REQUEST,
    steps: preset.steps,
    isActive: true,
    createdBy: userId,
    updatedBy: userId,
  });

  return created.toObject();
};

const getFulfillmentNotificationCopy = (status) => {
  const normalizedStatus = normalizeAssetRequestStatus(status);

  if (normalizedStatus === ASSET_REQUEST_STATUS.FULFILLED) {
    return {
      subjectPrefix: "Asset request fulfilled",
      message: "Your asset request has been fulfilled successfully.",
      type: NOTIFICATION_TYPES.ASSET_REQUEST_FULFILLED,
    };
  }

  if (normalizedStatus === ASSET_REQUEST_STATUS.PARTIALLY_FULFILLED) {
    return {
      subjectPrefix: "Asset request partially fulfilled",
      message: "Your asset request has been partially fulfilled.",
      type: NOTIFICATION_TYPES.ASSET_REQUEST_FULFILLED,
    };
  }

  if (normalizedStatus === ASSET_REQUEST_STATUS.OUT_OF_STOCK) {
    return {
      subjectPrefix: "Asset request out of stock",
      message: "Your asset request could not be fulfilled because the product is out of stock.",
      type: NOTIFICATION_TYPES.ASSET_REQUEST_FULFILLMENT_FAILED,
    };
  }

  if (normalizedStatus === ASSET_REQUEST_STATUS.FULFILLMENT_DELAYED) {
    return {
      subjectPrefix: "Asset fulfillment delayed",
      message: "Your asset request cannot be fulfilled right now. The fulfillment team will process it later.",
      type: NOTIFICATION_TYPES.ASSET_REQUEST_FULFILLMENT_DELAYED,
    };
  }

  if (normalizedStatus === ASSET_REQUEST_STATUS.PROCUREMENT_REQUIRED) {
    return {
      subjectPrefix: "Asset request needs procurement",
      message: "Your asset request needs procurement before it can be fulfilled.",
      type: NOTIFICATION_TYPES.ASSET_REQUEST_FULFILLMENT_FAILED,
    };
  }

  return null;
};

const notifyRequesterAboutFulfillment = async (request, status, actorId, extra = {}) => {
  if (!request?.employeeId) return null;

  const copy = getFulfillmentNotificationCopy(status);
  if (!copy) return null;

  const product = request.productId
    ? await Product.findOne({ _id: request.productId, isDeleted: false }).select("name sku").lean()
    : null;
  const productLabel = product
    ? `${product.name}${product.sku ? ` (${product.sku})` : ""}`
    : "requested product";
  const remarks = extra.remarks ? `\n\nRemarks: ${extra.remarks}` : "";

  return notificationService.notifyUserByEmail(
    {
      spaceId: request.spaceId,
      recipientUserId: request.employeeId,
      type: copy.type,
      subject: `${copy.subjectPrefix}: ${request.requestNumber}`,
      body: [
        copy.message,
        `Request Number: ${request.requestNumber}`,
        `Product: ${productLabel}`,
        `Status: ${normalizeAssetRequestStatus(status)}`,
        remarks,
      ].filter(Boolean).join("\n"),
      metadata: {
        assetRequestId: request._id,
        requestNumber: request.requestNumber,
        status: normalizeAssetRequestStatus(status),
      },
    },
    actorId
  );
};

const notifyRequesterAboutFulfillmentError = async (request, error, actorId) => {
  if (!request?.employeeId) return null;

  return notificationService.notifyUserByEmail(
    {
      spaceId: request.spaceId,
      recipientUserId: request.employeeId,
      type: NOTIFICATION_TYPES.ASSET_REQUEST_FULFILLMENT_FAILED,
      subject: `Asset fulfillment failed: ${request.requestNumber}`,
      body: [
        "Your asset request could not be fulfilled at this time.",
        `Request Number: ${request.requestNumber}`,
        `Status: ${normalizeAssetRequestStatus(request.status)}`,
        `Reason: ${error.message}`,
      ].join("\n"),
      metadata: {
        assetRequestId: request._id,
        requestNumber: request.requestNumber,
        status: normalizeAssetRequestStatus(request.status),
        errorMessage: error.message,
      },
    },
    actorId
  );
};

const createAssetRequest = async (payload, userId, context = {}) => {
  if (!context.spaceId) throw new AppError("Space ID is required", 400);

  const product = await Product.findOne({ _id: payload.productId, isDeleted: false }).lean();
  if (!product) throw new AppError("Product not found", 404);

  if (payload.requestType === ASSET_REQUEST_TYPE.MERCHANT_ASSET) {
    if (!payload.merchantId) throw new AppError("merchantId is required for merchant asset request", 400);
    const merchant = await Merchant.findOne({ _id: payload.merchantId, spaceId: context.spaceId, isDeleted: false }).lean();
    if (!merchant) throw new AppError("Merchant not found", 404);
  }

  const definition = await ensureWorkflowDefinition(context.spaceId, payload.requestType, userId);
  const firstStep = [...definition.steps].sort((a, b) => a.order - b.order)[0];

  const request = await assetRequestRepository.create({
    requestNumber: await generateRequestNumber(),
    spaceId: context.spaceId,
    requestType: payload.requestType,
    employeeId: userId,
    merchantId: payload.requestType === ASSET_REQUEST_TYPE.MERCHANT_ASSET ? payload.merchantId : null,
    productId: payload.productId,
    requestedQuantity: payload.requestedQuantity,
    fulfilledQuantity: 0,
    remainingQuantity: payload.requestedQuantity,
    businessJustification: payload.businessJustification,
    priority: payload.priority,
    status: STEP_TO_STATUS[firstStep.stepKey],
    createdBy: userId,
    updatedBy: userId,
  });

  await WorkflowInstance.create({
    spaceId: context.spaceId,
    workflowDefinitionId: definition._id,
    entityType: WORKFLOW_ENTITY_TYPES.ASSET_REQUEST,
    entityId: request._id,
    status: WORKFLOW_STATUS.ACTIVE,
    currentStepKey: firstStep.stepKey,
    startedBy: userId,
    createdBy: userId,
    updatedBy: userId,
  });

  return request;
};

const getAssetRequests = async (filters) => assetRequestRepository.paginate(filters);

const getFulfillmentQueue = async (filters) => assetRequestRepository.fulfillmentQueue(filters);

  const getAssetRequestById = async (id, context = {}) => {
    const request = await assetRequestRepository.findById(id, context.spaceId);
    if (!request) throw new AppError("Asset request not found", 404);

    const [approvals, assignedAssets] = await Promise.all([
      assetRequestApprovalRepository.findByAssetRequestId(id, context.spaceId),
      assetRegistryRepository.findByRequestId(id, context.spaceId),
    ]);
    return { ...request, approvals, assignedAssets };
  };

const getActiveWorkflowInstance = async (request) => {
  const instance = await WorkflowInstance.findOne({
    spaceId: request.spaceId,
    entityType: WORKFLOW_ENTITY_TYPES.ASSET_REQUEST,
    entityId: request._id,
    status: WORKFLOW_STATUS.ACTIVE,
    isDeleted: false,
  }).populate("workflowDefinitionId", "steps");

  if (!instance) throw new AppError("Workflow instance not found", 404);
  return instance;
};

const transition = async ({ request, stepKey, action, userId, remarks, rejectionReason }) => {
  if (TERMINAL_STATUSES.includes(request.status)) {
    throw new AppError("Request is already closed", 400);
  }

  const instance = await getActiveWorkflowInstance(request);
  if (normalizeStepKey(instance.currentStepKey) !== normalizeStepKey(stepKey)) {
    throw new AppError("Action does not match current workflow step", 400);
  }

  const definition = instance.workflowDefinitionId;
  const currentStep = definition.steps.find((s) => normalizeStepKey(s.stepKey) === normalizeStepKey(instance.currentStepKey));
  if (!currentStep) throw new AppError("Workflow step not found", 400);

  await AssetRequestApproval.create({
    spaceId: request.spaceId,
    assetRequestId: request._id,
    stepKey,
    approverId: userId,
    action: action === WORKFLOW_ACTIONS.REJECT ? ASSET_REQUEST_APPROVAL_ACTIONS.REJECTED : ASSET_REQUEST_APPROVAL_ACTIONS.APPROVED,
    remarks: remarks || rejectionReason || "",
    actionAt: new Date(),
  });

  const history = [
    ...(instance.history || []),
    { stepKey, action, remarks: remarks || rejectionReason || "", performedBy: userId, performedAt: new Date(), metadata: {} },
  ];

  if (action === WORKFLOW_ACTIONS.REJECT) {
    await WorkflowInstance.findByIdAndUpdate(instance._id, {
      status: WORKFLOW_STATUS.CANCELLED,
      completedAt: new Date(),
      history,
      updatedBy: userId,
    });

    return assetRequestRepository.updateById(request._id, request.spaceId, {
      status: ASSET_REQUEST_STATUS.REJECTED,
      rejectionReason: rejectionReason || remarks || "",
      fulfilledQuantity: 0,
      remainingQuantity: request.requestedQuantity,
      updatedBy: userId,
    });
  }

  const nextStepKey = normalizeStepKey(currentStep.nextStepKey || "");

  if (!nextStepKey) {
    await WorkflowInstance.findByIdAndUpdate(instance._id, {
      status: WORKFLOW_STATUS.COMPLETED,
      completedAt: new Date(),
      history,
      updatedBy: userId,
    });

    return assetRequestRepository.updateById(request._id, request.spaceId, {
      status: ASSET_REQUEST_STATUS.FULFILLED,
      fulfilledAt: new Date(),
      fulfilledQuantity: request.requestedQuantity,
      remainingQuantity: 0,
      updatedBy: userId,
    });
  }

  await WorkflowInstance.findByIdAndUpdate(instance._id, {
    currentStepKey: nextStepKey,
    history,
    updatedBy: userId,
  });

  return assetRequestRepository.updateById(request._id, request.spaceId, {
    status: STEP_TO_STATUS[nextStepKey] || request.status,
    updatedBy: userId,
  });
};

const approveRequest = async (id, payload, userId, context = {}) => {
  const request = await AssetRequest.findOne({ _id: id, spaceId: context.spaceId, isDeleted: false });
  if (!request) throw new AppError("Asset request not found", 404);
  if (TERMINAL_STATUSES.includes(request.status)) {
    throw new AppError("Request cannot be approved", 400);
  }

  return transition({ request, stepKey: payload.stepKey, action: WORKFLOW_ACTIONS.APPROVE, userId, remarks: payload.remarks });
};

const fulfillRequestCore = async (id, payload, userId, context = {}) => {
  const request = await AssetRequest.findOne({ _id: id, spaceId: context.spaceId, isDeleted: false });
  if (!request) throw new AppError("Asset request not found", 404);

  if (!FULFILLABLE_STATUSES.includes(normalizeAssetRequestStatus(request.status))) {
    throw new AppError("Request is not pending fulfillment", 400);
  }

  if (payload.fulfillmentStatus === ASSET_REQUEST_STATUS.FULFILLMENT_DELAYED) {
    return assetRequestRepository.updateById(request._id, request.spaceId, {
      status: ASSET_REQUEST_STATUS.FULFILLMENT_DELAYED,
      fulfilledQuantity: Number(request.fulfilledQuantity || 0),
      remainingQuantity: Number(request.remainingQuantity || request.requestedQuantity || 0),
      updatedBy: userId,
    });
  }

  if (
    payload.fulfillmentStatus === ASSET_REQUEST_STATUS.OUT_OF_STOCK ||
    payload.fulfillmentStatus === ASSET_REQUEST_STATUS.PARTIALLY_FULFILLED ||
    payload.fulfillmentStatus === ASSET_REQUEST_STATUS.PROCUREMENT_REQUIRED
  ) {
    const fulfilledQuantity = payload.fulfillmentStatus === ASSET_REQUEST_STATUS.PARTIALLY_FULFILLED
      ? Math.max(0, Number(payload.fulfilledQuantity || 0))
      : 0;

    return assetRequestRepository.updateById(request._id, request.spaceId, {
      status: payload.fulfillmentStatus,
      fulfilledQuantity,
      remainingQuantity: Math.max(0, Number(request.requestedQuantity || 0) - fulfilledQuantity),
      updatedBy: userId,
    });
  }

  const product = await Product.findOne({ _id: request.productId, isDeleted: false }).lean();
  if (!product) throw new AppError("Product not found", 404);

  if (product.trackingType === PRODUCT_TRACKING_TYPES.BULK) {
    let bulkFulfillmentResult = null;

    const fulfillBulkStock = async (session = null) => {
      const stockQuery = InventoryStock.findOne(
        {
          productId: request.productId,
          spaceId: request.spaceId,
          isDeleted: false,
          availableQuantity: { $gt: 0 },
        },
      );

      if (session) {
        stockQuery.session(session);
      }

      const stock = await stockQuery;

      if (!stock) {
        bulkFulfillmentResult = await assetRequestRepository.updateById(request._id, request.spaceId, {
          status: payload.fulfillmentStatus || ASSET_REQUEST_STATUS.OUT_OF_STOCK,
          fulfilledQuantity: 0,
          remainingQuantity: request.requestedQuantity,
          fulfilledAt: null,
          updatedBy: userId,
        });

        return;
      }

      const fulfilledQuantity = Math.min(Number(stock.availableQuantity || 0), Number(request.requestedQuantity || 0));
      const remainingQuantity = Number(request.requestedQuantity || 0) - fulfilledQuantity;

      if (fulfilledQuantity <= 0) {
        throw new AppError("Insufficient bulk inventory stock", 400);
      }

      stock.availableQuantity = Number(stock.availableQuantity || 0) - fulfilledQuantity;
      stock.allocatedQuantity = Number(stock.allocatedQuantity || 0) + fulfilledQuantity;
      stock.updatedBy = userId;
      await stock.save(session ? { session } : {});

      const requestStatus = fulfilledQuantity < Number(request.requestedQuantity || 0)
        ? ASSET_REQUEST_STATUS.PARTIALLY_FULFILLED
        : ASSET_REQUEST_STATUS.FULFILLED;

      await assetRegistryRepository.create(
        {
          productId: request.productId,
          assignedToUserId: request.requestType === ASSET_REQUEST_TYPE.MERCHANT_ASSET ? null : request.employeeId,
          assignedToMerchantId: request.requestType === ASSET_REQUEST_TYPE.MERCHANT_ASSET ? request.merchantId : null,
          assignedSpaceId: request.spaceId,
          assignedByUserId: userId,
          requestId: request._id,
          quantity: fulfilledQuantity,
          status: assetRegistryRepository.ASSET_REGISTRY_STATUS.ASSIGNED,
          remarks: payload.remarks || "Bulk inventory fulfilled via asset request",
        },
        session
      );

      await inventoryTransactionRepository.create(
        {
          spaceId: request.spaceId,
          inventoryStockId: stock._id,
          productId: request.productId,
          requestId: request._id,
          transactionType: INVENTORY_TRANSACTION_TYPES.STOCK_OUT,
          quantity: fulfilledQuantity,
          toUserId: request.requestType === ASSET_REQUEST_TYPE.MERCHANT_ASSET ? null : request.employeeId,
          toMerchantId: request.requestType === ASSET_REQUEST_TYPE.MERCHANT_ASSET ? request.merchantId : null,
          remarks: payload.remarks || "Bulk inventory fulfilled via asset request",
          previousStatus: "AVAILABLE",
          newStatus: "ALLOCATED",
          performedBy: userId,
        },
        session
      );

      await assetRequestRepository.updateById(request._id, request.spaceId, {
        status: requestStatus,
        fulfilledQuantity,
        remainingQuantity,
        fulfilledAt: new Date(),
        updatedBy: userId,
      });

      if (requestStatus !== ASSET_REQUEST_STATUS.FULFILLED) {
        await WorkflowInstance.findOneAndUpdate(
          {
            spaceId: request.spaceId,
            entityType: WORKFLOW_ENTITY_TYPES.ASSET_REQUEST,
            entityId: request._id,
            status: WORKFLOW_STATUS.ACTIVE,
            isDeleted: false,
          },
          {
            status: WORKFLOW_STATUS.COMPLETED,
            completedAt: new Date(),
            history: [
              {
                stepKey: ASSET_REQUEST_STEP_KEYS.FULFILLMENT,
                action: WORKFLOW_ACTIONS.COMPLETE,
                remarks: payload.remarks || "Bulk fulfillment completed with remaining quantity",
                performedBy: userId,
                performedAt: new Date(),
                metadata: { fulfilledQuantity, remainingQuantity, requestStatus },
              },
            ],
            updatedBy: userId,
          }
        );

        bulkFulfillmentResult = await assetRequestRepository.updateById(request._id, request.spaceId, {
          status: requestStatus,
          fulfilledQuantity,
          remainingQuantity,
          updatedBy: userId,
        });
      }
    };

    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      await fulfillBulkStock(session);
      await session.commitTransaction();
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction().catch(() => {});
      }
      if (isTransactionUnsupportedError(error)) {
        await fulfillBulkStock();
      } else {
        throw error;
      }
    } finally {
      session.endSession();
    }

    if (bulkFulfillmentResult) {
      return bulkFulfillmentResult;
    }

    return transition({
      request: { ...request.toObject(), fulfilledQuantity: Number(request.requestedQuantity || 0), remainingQuantity: 0 },
      stepKey: ASSET_REQUEST_STEP_KEYS.FULFILLMENT,
      action: WORKFLOW_ACTIONS.COMPLETE,
      userId,
      remarks: payload.remarks,
    });
  }

  const requestedAssetIds = Array.isArray(payload.inventoryAssetIds)
    ? [...new Set(payload.inventoryAssetIds.map(String))]
    : [];

  if (requestedAssetIds.length && requestedAssetIds.length !== request.requestedQuantity) {
    throw new AppError(`Select exactly ${request.requestedQuantity} serialized assets`, 400);
  }

  const assetQuery = {
    productId: request.productId,
    status: INVENTORY_STATUS.AVAILABLE,
    isDeleted: false,
  };

  if (requestedAssetIds.length) {
    assetQuery._id = { $in: requestedAssetIds };
  }

  const inventoryItems = await InventoryItem.find(assetQuery)
    .sort({ createdAt: 1, _id: 1 })
    .limit(request.requestedQuantity)
    .lean();

  if (inventoryItems.length < request.requestedQuantity) {
    throw new AppError("Not enough available serialized assets found for fulfillment", 400);
  }

  for (const inventoryItem of inventoryItems) {
    if (request.requestType === ASSET_REQUEST_TYPE.MERCHANT_ASSET) {
      await inventoryTransactionService.createTransaction({
        inventoryItemId: inventoryItem._id,
        transactionType: INVENTORY_TRANSACTION_TYPES.ASSIGNMENT,
        toMerchantId: request.merchantId,
        requestId: request._id,
        remarks: payload.remarks || "Assigned to merchant via asset request",
      }, userId, context);
    } else {
      await inventoryTransactionService.createTransaction({
        inventoryItemId: inventoryItem._id,
        transactionType: INVENTORY_TRANSACTION_TYPES.ASSIGNMENT,
        toUserId: request.employeeId,
        requestId: request._id,
        remarks: payload.remarks || "Assigned to employee via asset request",
      }, userId, context);
    }
  }

  await assetRequestRepository.updateById(request._id, request.spaceId, {
    inventoryItemId: inventoryItems[0]._id,
    fulfilledQuantity: request.requestedQuantity,
    remainingQuantity: 0,
    fulfilledAt: new Date(),
    status: ASSET_REQUEST_STATUS.FULFILLED,
    updatedBy: userId,
  });

  return transition({
    request: { ...request.toObject(), inventoryItemId: inventoryItems[0]._id, fulfilledQuantity: request.requestedQuantity, remainingQuantity: 0 },
    stepKey: ASSET_REQUEST_STEP_KEYS.FULFILLMENT,
    action: WORKFLOW_ACTIONS.COMPLETE,
    userId,
    remarks: payload.remarks,
  });
};

const fulfillRequest = async (id, payload, userId, context = {}) => {
  try {
    const result = await fulfillRequestCore(id, payload, userId, context);
    await notifyRequesterAboutFulfillment(result, result.status, userId, {
      remarks: payload.remarks,
    }).catch(() => {});
    return result;
  } catch (error) {
    const request = await AssetRequest.findOne({ _id: id, spaceId: context.spaceId, isDeleted: false }).lean();
    if (request && FULFILLABLE_STATUSES.includes(normalizeAssetRequestStatus(request.status))) {
      await notifyRequesterAboutFulfillmentError(request, error, userId).catch(() => {});
    }
    throw error;
  }
};

const rejectRequest = async (id, payload, userId, context = {}) => {
  const request = await AssetRequest.findOne({ _id: id, spaceId: context.spaceId, isDeleted: false });
  if (!request) throw new AppError("Asset request not found", 404);

  return transition({ request, stepKey: payload.stepKey, action: WORKFLOW_ACTIONS.REJECT, userId, remarks: payload.remarks, rejectionReason: payload.rejectionReason });
};

const cancelRequest = async (id, userId, context = {}) => {
  const request = await AssetRequest.findOne({ _id: id, spaceId: context.spaceId, isDeleted: false });
  if (!request) throw new AppError("Asset request not found", 404);
  if (String(request.employeeId) !== String(userId)) throw new AppError("Only the requester can cancel this request", 403);
  if (TERMINAL_STATUSES.includes(request.status)) throw new AppError("Request is already closed", 400);
  if (request.status === ASSET_REQUEST_STATUS.FULFILLED) throw new AppError("Fulfilled request cannot be cancelled", 400);

  await WorkflowInstance.findOneAndUpdate(
    { spaceId: request.spaceId, entityType: WORKFLOW_ENTITY_TYPES.ASSET_REQUEST, entityId: request._id, status: WORKFLOW_STATUS.ACTIVE, isDeleted: false },
    { status: WORKFLOW_STATUS.CANCELLED, completedAt: new Date(), updatedBy: userId }
  );

  return assetRequestRepository.updateById(id, request.spaceId, { status: ASSET_REQUEST_STATUS.CANCELLED, updatedBy: userId });
};

const managerApproveRequest = (id, payload, userId, context) => approveRequest(id, { ...payload, stepKey: ASSET_REQUEST_STEP_KEYS.MANAGER_APPROVAL }, userId, context);
const itApproveRequest = (id, payload, userId, context) => approveRequest(id, { ...payload, stepKey: ASSET_REQUEST_STEP_KEYS.IT_APPROVAL }, userId, context);
const zonalApproveRequest = (id, payload, userId, context) => approveRequest(id, { ...payload, stepKey: ASSET_REQUEST_STEP_KEYS.ZONAL_APPROVAL }, userId, context);

const forwardRequest = async () => {
  throw new AppError("Forward flow removed in v1 workflow architecture", 400);
};

module.exports = {
  createAssetRequest,
  getAssetRequests,
  getFulfillmentQueue,
  getAssetRequestById,
  approveRequest,
  fulfillRequest,
  managerApproveRequest,
  itApproveRequest,
  zonalApproveRequest,
  rejectRequest,
  cancelRequest,
  forwardRequest,
};
