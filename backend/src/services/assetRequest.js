const AssetRequest = require("../models/assetRequest");
const AssetRequestApproval = require("../models/assetRequestApproval");
const WorkflowDefinition = require("../models/workflowDefinition");
const WorkflowInstance = require("../models/workflowInstance");
const Product = require("../models/product");
const Merchant = require("../models/merchant");
const InventoryItem = require("../models/inventory");

const assetRequestRepository = require("../repositories/assetRequest");
const assetRequestApprovalRepository = require("../repositories/assetRequestApproval");
const inventoryTransactionService = require("./inventoryTransaction");

const {
  ASSET_REQUEST_STATUS,
  ASSET_REQUEST_TYPE,
  ASSET_REQUEST_STEP_KEYS,
  ASSET_REQUEST_APPROVAL_ACTIONS,
} = require("../constants/assetRequest");
const { INVENTORY_STATUS } = require("../constants/inventory");
const { INVENTORY_TRANSACTION_TYPES } = require("../constants/inventoryTransaction");
const { WORKFLOW_ENTITY_TYPES, WORKFLOW_STATUS, WORKFLOW_ACTIONS } = require("../constants/workflow");

const AppError = require("../utils/appError");

const STEP_TO_STATUS = {
  [ASSET_REQUEST_STEP_KEYS.MANAGER_APPROVAL]: ASSET_REQUEST_STATUS.PENDING_MANAGER,
  [ASSET_REQUEST_STEP_KEYS.IT_APPROVAL]: ASSET_REQUEST_STATUS.PENDING_IT,
  [ASSET_REQUEST_STEP_KEYS.ZONAL_MANAGER_APPROVAL]: ASSET_REQUEST_STATUS.PENDING_ZONAL_MANAGER,
  [ASSET_REQUEST_STEP_KEYS.WAREHOUSE_FULFILLMENT]: ASSET_REQUEST_STATUS.FULFILLMENT_PENDING,
};

const TERMINAL_STATUSES = [
  ASSET_REQUEST_STATUS.CANCELLED,
  ASSET_REQUEST_STATUS.REJECTED,
  ASSET_REQUEST_STATUS.FULFILLED,
];

const DEFAULT_WORKFLOWS = {
  [ASSET_REQUEST_TYPE.EMPLOYEE_ASSET]: {
    code: "EMPLOYEE_ASSET_REQUEST",
    name: "Employee Asset Workflow",
    steps: [
      { stepKey: ASSET_REQUEST_STEP_KEYS.MANAGER_APPROVAL, name: "Manager Approval", order: 1, allowedActions: [WORKFLOW_ACTIONS.APPROVE, WORKFLOW_ACTIONS.REJECT], nextStepKey: ASSET_REQUEST_STEP_KEYS.IT_APPROVAL },
      { stepKey: ASSET_REQUEST_STEP_KEYS.IT_APPROVAL, name: "IT Approval", order: 2, allowedActions: [WORKFLOW_ACTIONS.APPROVE, WORKFLOW_ACTIONS.REJECT], nextStepKey: ASSET_REQUEST_STEP_KEYS.WAREHOUSE_FULFILLMENT },
      { stepKey: ASSET_REQUEST_STEP_KEYS.WAREHOUSE_FULFILLMENT, name: "Warehouse Fulfillment", order: 3, allowedActions: [WORKFLOW_ACTIONS.COMPLETE, WORKFLOW_ACTIONS.REJECT], nextStepKey: "" },
    ],
  },
  [ASSET_REQUEST_TYPE.MERCHANT_ASSET]: {
    code: "MERCHANT_ASSET_REQUEST",
    name: "Merchant Asset Workflow",
    steps: [
      { stepKey: ASSET_REQUEST_STEP_KEYS.ZONAL_MANAGER_APPROVAL, name: "Zonal Manager Approval", order: 1, allowedActions: [WORKFLOW_ACTIONS.APPROVE, WORKFLOW_ACTIONS.REJECT], nextStepKey: ASSET_REQUEST_STEP_KEYS.WAREHOUSE_FULFILLMENT },
      { stepKey: ASSET_REQUEST_STEP_KEYS.WAREHOUSE_FULFILLMENT, name: "Warehouse Fulfillment", order: 2, allowedActions: [WORKFLOW_ACTIONS.COMPLETE, WORKFLOW_ACTIONS.REJECT], nextStepKey: "" },
    ],
  },
};

const generateRequestNumber = async () => {
  const count = await AssetRequest.countDocuments();
  return `AR-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
};

const ensureWorkflowDefinition = async (spaceId, requestType, userId) => {
  const preset = DEFAULT_WORKFLOWS[requestType];
  if (!preset) throw new AppError("Unsupported request type", 400);

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

const getAssetRequestById = async (id, context = {}) => {
  const request = await assetRequestRepository.findById(id, context.spaceId);
  if (!request) throw new AppError("Asset request not found", 404);

  const approvals = await assetRequestApprovalRepository.findByAssetRequestId(id);
  return { ...request, approvals };
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
  if (instance.currentStepKey !== stepKey) throw new AppError("Action does not match current workflow step", 400);

  const definition = instance.workflowDefinitionId;
  const currentStep = definition.steps.find((s) => s.stepKey === instance.currentStepKey);
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
      updatedBy: userId,
    });
  }

  const nextStepKey = currentStep.nextStepKey || "";

  // If approving and the next step is warehouse fulfillment, ensure an available inventory item exists
  if (action === WORKFLOW_ACTIONS.APPROVE && nextStepKey === ASSET_REQUEST_STEP_KEYS.WAREHOUSE_FULFILLMENT) {
    const availableItem = await InventoryItem.findOne({
      spaceId: request.spaceId,
      productId: request.productId,
      status: INVENTORY_STATUS.AVAILABLE,
      isDeleted: false,
    }).lean();

    if (!availableItem) {
      throw new AppError("No available inventory item found for fulfillment", 400);
    }
  }

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

const approveRequest = async (id, payload, userId) => {
  const request = await AssetRequest.findOne({ _id: id, isDeleted: false });
  if (!request) throw new AppError("Asset request not found", 404);
  if (TERMINAL_STATUSES.includes(request.status)) {
    throw new AppError("Request cannot be approved", 400);
  }

  return transition({ request, stepKey: payload.stepKey, action: WORKFLOW_ACTIONS.APPROVE, userId, remarks: payload.remarks });
};

const fulfillRequest = async (id, payload, userId, context = {}) => {
  const request = await AssetRequest.findOne({ _id: id, isDeleted: false });
  if (!request) throw new AppError("Asset request not found", 404);

  const inventoryItem = await InventoryItem.findOne({
    spaceId: request.spaceId,
    productId: request.productId,
    status: INVENTORY_STATUS.AVAILABLE,
    isDeleted: false,
  }).lean();

  if (!inventoryItem) throw new AppError("No available inventory item found for fulfillment", 400);

  if (request.requestType === ASSET_REQUEST_TYPE.MERCHANT_ASSET) {
    await inventoryTransactionService.createTransaction({
      inventoryItemId: inventoryItem._id,
      transactionType: INVENTORY_TRANSACTION_TYPES.ASSIGN_MERCHANT,
      toMerchantId: request.merchantId,
      remarks: payload.remarks || "Assigned to merchant via asset request",
    }, userId, context);
  } else {
    await inventoryTransactionService.createTransaction({
      inventoryItemId: inventoryItem._id,
      transactionType: INVENTORY_TRANSACTION_TYPES.ASSIGN_EMPLOYEE,
      toUserId: request.employeeId,
      remarks: payload.remarks || "Assigned to employee via asset request",
    }, userId, context);
  }

  await assetRequestRepository.updateById(request._id, request.spaceId, { inventoryItemId: inventoryItem._id, updatedBy: userId });

  return transition({
    request: { ...request.toObject(), inventoryItemId: inventoryItem._id },
    stepKey: ASSET_REQUEST_STEP_KEYS.WAREHOUSE_FULFILLMENT,
    action: WORKFLOW_ACTIONS.COMPLETE,
    userId,
    remarks: payload.remarks,
  });
};

const rejectRequest = async (id, payload, userId) => {
  const request = await AssetRequest.findOne({ _id: id, isDeleted: false });
  if (!request) throw new AppError("Asset request not found", 404);

  return transition({ request, stepKey: payload.stepKey, action: WORKFLOW_ACTIONS.REJECT, userId, remarks: payload.remarks, rejectionReason: payload.rejectionReason });
};

const cancelRequest = async (id, userId) => {
  const request = await AssetRequest.findOne({ _id: id, isDeleted: false });
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

const managerApproveRequest = (id, payload, userId) => approveRequest(id, { ...payload, stepKey: ASSET_REQUEST_STEP_KEYS.MANAGER_APPROVAL }, userId);
const itApproveRequest = (id, payload, userId) => approveRequest(id, { ...payload, stepKey: ASSET_REQUEST_STEP_KEYS.IT_APPROVAL }, userId);

const forwardRequest = async () => {
  throw new AppError("Forward flow removed in v1 workflow architecture", 400);
};

module.exports = {
  createAssetRequest,
  getAssetRequests,
  getAssetRequestById,
  approveRequest,
  fulfillRequest,
  managerApproveRequest,
  itApproveRequest,
  rejectRequest,
  cancelRequest,
  forwardRequest,
};
