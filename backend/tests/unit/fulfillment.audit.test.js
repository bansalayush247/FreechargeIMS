const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const modulePaths = {
  assetRequestService: require.resolve("../../src/services/assetRequest"),
  inventoryTransactionService: require.resolve("../../src/services/inventoryTransaction"),
  assetRequestModel: require.resolve("../../src/models/assetRequest"),
  assetRequestApprovalModel: require.resolve("../../src/models/assetRequestApproval"),
  workflowDefinitionModel: require.resolve("../../src/models/workflowDefinition"),
  workflowInstanceModel: require.resolve("../../src/models/workflowInstance"),
  productModel: require.resolve("../../src/models/product"),
  merchantModel: require.resolve("../../src/models/merchant"),
  inventoryItemModel: require.resolve("../../src/models/inventory"),
  inventoryStockModel: require.resolve("../../src/models/inventoryStock"),
  assetRequestRepository: require.resolve("../../src/repositories/assetRequest"),
  assetRequestApprovalRepository: require.resolve("../../src/repositories/assetRequestApproval"),
  assetRegistryRepository: require.resolve("../../src/repositories/assetRegistry"),
  inventoryTransactionRepository: require.resolve("../../src/repositories/inventoryTransaction"),
  auditLogService: require.resolve("../../src/services/auditLog"),
  authorizePermission: require.resolve("../../src/services/permissionResolver"),
  userModel: require.resolve("../../src/models/user"),
  warehouseModel: require.resolve("../../src/models/warehouse"),
};

const loadAssetRequestService = (mocks) => {
  for (const path of Object.values(modulePaths)) {
    delete require.cache[path];
  }

  const defaultMocks = {
    [modulePaths.assetRequestModel]: {
      findOne: () => ({
        _id: "request-1",
        spaceId: "space-1",
        status: "PENDING_FULFILLMENT",
        requestedQuantity: 20,
        requestType: "EMPLOYEE_ASSET",
        productId: "product-1",
        employeeId: "employee-1",
        merchantId: null,
        toObject() {
          return this;
        },
      }),
    },
    [modulePaths.assetRequestApprovalModel]: {
      create: async () => ({}),
    },
    [modulePaths.workflowDefinitionModel]: {
      findOne: () => ({ lean: async () => null }),
      create: async (payload) => ({ ...payload, _id: "workflow-def" }),
    },
    [modulePaths.workflowInstanceModel]: {
      create: async () => ({}),
      findOneAndUpdate: async () => ({}),
    },
    [modulePaths.productModel]: {
      findOne: () => ({ lean: async () => ({ _id: "product-1", trackingType: "BULK" }) }),
    },
    [modulePaths.merchantModel]: {
      findOne: () => ({ lean: async () => ({ _id: "merchant-1" }) }),
    },
    [modulePaths.inventoryItemModel]: {
      find: () => ({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) }),
    },
    [modulePaths.inventoryStockModel]: {
      findOne: () => ({
        session() {
          return this;
        },
      }),
    },
    [modulePaths.assetRequestRepository]: {
      create: async (payload) => ({ ...payload, _id: "request-1", toObject: () => ({ ...payload, _id: "request-1" }) }),
      findById: async () => null,
      updateById: async (_id, _spaceId, payload) => ({ _id, ...payload }),
      paginate: async () => ({ items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
      fulfillmentQueue: async () => ({ items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
    },
    [modulePaths.assetRequestApprovalRepository]: {
      findByAssetRequestId: async () => [],
    },
    [modulePaths.assetRegistryRepository]: {
      ASSET_REGISTRY_STATUS: {
        ASSIGNED: "ASSIGNED",
        RETURNED: "RETURNED",
      },
      create: async (payload) => payload,
      findActiveByInventoryItemAndAssignee: async () => null,
      paginateBySpace: async () => ({ items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
    },
    [modulePaths.inventoryTransactionRepository]: {
      create: async (payload) => payload,
      findById: async () => null,
      paginate: async () => ({ items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
      getItemAuditTrail: async () => [],
    },
    [modulePaths.auditLogService]: {
      recordAuditLog: async () => ({}),
    },
    [modulePaths.authorizePermission]: {
      authorizePermission: async () => true,
      assertActiveMembership: async () => true,
    },
    [modulePaths.userModel]: {},
    [modulePaths.warehouseModel]: {},
  };

  const mergedMocks = { ...defaultMocks, ...mocks };

  for (const [path, exportsValue] of Object.entries(mergedMocks)) {
    require.cache[path] = {
      id: path,
      filename: path,
      loaded: true,
      exports: exportsValue,
    };
  }

  return require("../../src/services/assetRequest");
};

const loadInventoryTransactionService = (mocks) => {
  for (const path of Object.values(modulePaths)) {
    delete require.cache[path];
  }

  const defaultMocks = {
    [modulePaths.assetRequestModel]: {
      findOne: () => ({
        select() {
          return this;
        },
        lean: async () => null,
      }),
    },
    [modulePaths.inventoryItemModel]: {
      findOne: () => ({
        session() {
          return this;
        },
      }),
    },
    [modulePaths.warehouseModel]: {
      findOne: () => ({ lean: async () => ({ _id: "warehouse-1", spaceId: "space-1" }) }),
      findById: () => ({ select: () => ({ lean: async () => ({ spaceId: "space-1" }) }) }),
    },
    [modulePaths.userModel]: {
      findById: async () => ({
        lean() {
          return Promise.resolve({ _id: "user-1" });
        },
      }),
    },
    [modulePaths.assetRegistryRepository]: {
      ASSET_REGISTRY_STATUS: {
        ASSIGNED: "ASSIGNED",
        RETURNED: "RETURNED",
      },
      create: async (payload) => payload,
      findActiveByInventoryItemAndAssignee: async () => ({
        assignedToUserId: "user-1",
        assignedToMerchantId: null,
        assignedSpaceId: "space-1",
        assignedByUserId: "user-assigner",
        requestId: "request-1",
        quantity: 1,
      }),
    },
    [modulePaths.inventoryTransactionRepository]: {
      create: async (payload) => payload,
      findById: async () => null,
      paginate: async () => ({ items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
      getItemAuditTrail: async () => [],
    },
    [modulePaths.auditLogService]: {
      recordAuditLog: async () => ({}),
    },
    [modulePaths.authorizePermission]: {
      authorizePermission: async () => true,
      assertActiveMembership: async () => true,
    },
    [modulePaths.assetRequestApprovalRepository]: {
      create: async () => ({}),
    },
    [modulePaths.assetRequestRepository]: {
      create: async () => ({}),
      findById: async () => null,
      updateById: async () => ({}),
      paginate: async () => ({ items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
      fulfillmentQueue: async () => ({ items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
    },
    [modulePaths.productModel]: {
      findOne: () => ({ lean: async () => ({ _id: "product-1", trackingType: "SERIALIZED" }) }),
    },
    [modulePaths.workflowDefinitionModel]: {
      findOne: () => ({ lean: async () => null }),
      create: async () => ({ _id: "workflow-def" }),
    },
    [modulePaths.workflowInstanceModel]: {
      create: async () => ({}),
      findOneAndUpdate: async () => ({}),
    },
    [modulePaths.merchantModel]: {},
  };

  const mergedMocks = { ...defaultMocks, ...mocks };

  for (const [path, exportsValue] of Object.entries(mergedMocks)) {
    require.cache[path] = {
      id: path,
      filename: path,
      loaded: true,
      exports: exportsValue,
    };
  }

  return require("../../src/services/inventoryTransaction");
};

test("bulk fulfillment records a partial request without overwriting it as fulfilled", async () => {
  const fakeSession = {
    started: false,
    committed: false,
    aborted: false,
    startTransaction() {
      this.started = true;
    },
    async commitTransaction() {
      this.committed = true;
    },
    async abortTransaction() {
      this.aborted = true;
    },
    inTransaction() {
      return this.started && !this.committed;
    },
    endSession() {},
  };

  mongoose.startSession = async () => fakeSession;

  const requestUpdates = [];
  const registryCreates = [];
  const transactionCreates = [];
  const workflowUpdates = [];

  const service = loadAssetRequestService({
    [modulePaths.assetRequestRepository]: {
      create: async (payload) => ({ ...payload, _id: "request-1", toObject: () => ({ ...payload, _id: "request-1" }) }),
      findById: async () => null,
      updateById: async (_id, _spaceId, payload) => {
        requestUpdates.push(payload);
        return { _id: "request-1", ...payload };
      },
      paginate: async () => ({ items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
      fulfillmentQueue: async () => ({ items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
    },
    [modulePaths.workflowInstanceModel]: {
      create: async () => ({}),
      findOneAndUpdate: async (_query, update) => {
        workflowUpdates.push(update);
        return update;
      },
    },
    [modulePaths.assetRegistryRepository]: {
      ASSET_REGISTRY_STATUS: {
        ASSIGNED: "ASSIGNED",
        RETURNED: "RETURNED",
      },
      create: async (payload) => {
        registryCreates.push(payload);
        return payload;
      },
      findActiveByInventoryItemAndAssignee: async () => null,
      paginateBySpace: async () => ({ items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
    },
    [modulePaths.inventoryStockModel]: {
      findOne: () => {
        const stock = {
          _id: "stock-1",
          productId: "product-1",
          availableQuantity: 12,
          allocatedQuantity: 0,
          reorderLevel: 5,
          reorderQuantity: 10,
          updatedBy: null,
          async save() {
            return this;
          },
        };
        stock.session = () => stock;
        return stock;
      },
    },
    [modulePaths.inventoryTransactionRepository]: {
      create: async (payload) => {
        transactionCreates.push(payload);
        return payload;
      },
      findById: async () => null,
      paginate: async () => ({ items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
      getItemAuditTrail: async () => [],
    },
  });

  const result = await service.fulfillRequest(
    "request-1",
    { remarks: "partial delivery" },
    "user-1",
    { spaceId: "space-1" }
  );

  assert.equal(result.status, "PARTIALLY_FULFILLED");
  assert.equal(result.fulfilledQuantity, 12);
  assert.equal(result.remainingQuantity, 8);
  assert.equal(requestUpdates.at(-1).status, "PARTIALLY_FULFILLED");
  assert.equal(registryCreates.at(-1).quantity, 12);
  assert.equal(transactionCreates.at(-1).transactionType, "STOCK_OUT");
  assert.ok(workflowUpdates.length > 0);
});

test("assignment and return create immutable asset registry history entries", async () => {
  const assignmentCreates = [];
  const transactionCreates = [];

  const service = loadInventoryTransactionService({
    [modulePaths.inventoryItemModel]: {
      findOne: () => ({
        session() {
          return this;
        },
        async then(resolve) {
          resolve({
            _id: "item-1",
            productId: "product-1",
            warehouseId: "warehouse-1",
            quantity: 1,
            assetTag: "TAG-1",
            serialNumber: "SER-1",
            status: "AVAILABLE",
            assignedUserId: null,
            assignedMerchantId: null,
            toObject() {
              return this;
            },
            async save() {
              return this;
            },
          });
        },
      }),
    },
    [modulePaths.assetRegistryRepository]: {
      ASSET_REGISTRY_STATUS: {
        ASSIGNED: "ASSIGNED",
        RETURNED: "RETURNED",
      },
      create: async (payload) => {
        assignmentCreates.push(payload);
        return payload;
      },
      findActiveByInventoryItemAndAssignee: async () => ({
        assignedToUserId: "user-2",
        assignedToMerchantId: null,
        assignedSpaceId: "space-1",
        assignedByUserId: "user-1",
        requestId: "request-1",
        quantity: 1,
      }),
    },
    [modulePaths.userModel]: {
      findById: () => ({
        lean: async () => ({ _id: "user-1" }),
      }),
    },
    [modulePaths.inventoryTransactionRepository]: {
      create: async (payload) => {
        transactionCreates.push(payload);
        return payload;
      },
      findById: async () => null,
      paginate: async () => ({ items: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
      getItemAuditTrail: async () => [],
    },
  });

  mongoose.startSession = async () => ({
    startTransaction() {},
    async commitTransaction() {},
    async abortTransaction() {},
    inTransaction() { return false; },
    endSession() {},
  });

  await service.createTransaction(
    {
      inventoryItemId: "item-1",
      transactionType: "ASSIGNMENT",
      toUserId: "user-2",
      requestId: "request-1",
      remarks: "assign",
    },
    "user-1",
    { spaceId: "space-1" }
  );

  await service.createTransaction(
    {
      inventoryItemId: "item-1",
      transactionType: "RETURN",
      fromUserId: "user-2",
      requestId: "request-1",
      remarks: "return",
    },
    "user-1",
    { spaceId: "space-1" }
  );

  assert.equal(assignmentCreates.length, 2);
  assert.equal(assignmentCreates[0].status, "ASSIGNED");
  assert.equal(assignmentCreates[1].status, "RETURNED");
  assert.equal(transactionCreates[0].transactionType, "ASSIGNMENT");
  assert.equal(transactionCreates[1].transactionType, "RETURN");
});
