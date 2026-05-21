const Repair = require("../models/repair");
const InventoryItem = require("../models/inventory");

const repairRepository = require(
  "../repositories/repair"
);

const inventoryTransactionService = require(
  "./inventoryTransaction"
);
const auditLogService = require("./auditLog");

const {
  REPAIR_STATUS,
} = require("../constants/repair");

const {
  INVENTORY_TRANSACTION_TYPES,
} = require(
  "../constants/inventoryTransaction"
);
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");

const {
  OPEN_REPAIR_STATUSES,
  canCreateRepair,
  canCompleteRepair,
  canCancelRepair,
  getTransactionTypeForOutcome,
} = require("../domain/repairs/repair.rules");

const AppError = require("../utils/appError");
const logger = require("../config/logger");

// Handles generate repair number.
const generateRepairNumber = async () => {
  const count = await Repair.countDocuments();
  const sequence = String(count + 1).padStart(5, "0");

  return `RP-${new Date().getFullYear()}-${sequence}`;
};

// Handles create repair.
const createRepair = async (
  payload,
  userId,
  context = {}
) => {
  logger.info("Creating repair request");

  if (!context.spaceId) {
    throw new AppError("Space ID is required", 400);
  }

  const inventoryItem = await InventoryItem.findOne({
    _id: payload.inventoryItemId,
    isDeleted: false,
  }).lean();

  const activeRepair =
    await repairRepository.findActiveByInventoryItemId(
      payload.inventoryItemId,
      OPEN_REPAIR_STATUSES
    );

  const decision = canCreateRepair(
    inventoryItem,
    activeRepair
  );

  if (!decision.allowed) {
    throw new AppError(decision.message, 400);
  }

  const repairNumber = await generateRepairNumber();

  const repair = await repairRepository.create({
    ...payload,
    spaceId: context.spaceId,
    repairNumber,
    productId: inventoryItem.productId,
    warehouseId: inventoryItem.warehouseId,
    assignedUserId: inventoryItem.assignedUserId,
    reportedBy: userId,
    status: REPAIR_STATUS.OPEN,
    createdBy: userId,
  });

  await inventoryTransactionService.createTransaction(
    {
      inventoryItemId: inventoryItem._id,
      fromWarehouseId: inventoryItem.warehouseId,
      fromUserId: inventoryItem.assignedUserId,
      transactionType:
        INVENTORY_TRANSACTION_TYPES.REPAIR_SENT,
      remarks: `Repair request ${repair.repairNumber} created`,
    },
    userId,
    context
  );

  const updatedRepair =
    await repairRepository.updateById(repair._id, {
      status: REPAIR_STATUS.SENT_FOR_REPAIR,
      sentForRepairAt: new Date(),
      updatedBy: userId,
    });

  logger.info("Repair request created", {
    repairId: repair._id,
  });

  await auditLogService.recordAuditLog({
    spaceId: context.spaceId || null,
    actorId: userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITY_TYPES.REPAIR,
    entityId: repair._id,
    before: null,
    after: updatedRepair,
    metadata: {
      inventoryItemId: inventoryItem._id,
      repairNumber: repair.repairNumber,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return updatedRepair;
};

// Handles get repairs.
const getRepairs = async (filters) => {
  return repairRepository.paginate(filters);
};

// Handles get repair by id.
const getRepairById = async (id) => {
  const repair = await repairRepository.findById(id);

  if (!repair) {
    throw new AppError("Repair request not found", 404);
  }

  return repair;
};

// Handles update repair.
const updateRepair = async (
  id,
  payload,
  userId,
  context = {}
) => {
  const repair = await getRepairById(id);

  if (
    [
      REPAIR_STATUS.COMPLETED,
      REPAIR_STATUS.CANCELLED,
    ].includes(repair.status)
  ) {
    throw new AppError(
      "Completed or cancelled repair requests cannot be updated",
      400
    );
  }

  const updatedRepair = await repairRepository.updateById(id, {
    ...payload,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId: context.spaceId || null,
    actorId: userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: AUDIT_ENTITY_TYPES.REPAIR,
    entityId: id,
    before: repair,
    after: updatedRepair,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return updatedRepair;
};

// Handles complete repair.
const completeRepair = async (
  id,
  payload,
  userId,
  context = {}
) => {
  const repair = await getRepairById(id);
  const decision = canCompleteRepair(repair);

  if (!decision.allowed) {
    throw new AppError(decision.message, 400);
  }

  const transactionType = getTransactionTypeForOutcome(
    payload.outcome,
    INVENTORY_TRANSACTION_TYPES
  );

  await inventoryTransactionService.createTransaction(
    {
      inventoryItemId: repair.inventoryItemId._id,
      fromWarehouseId: repair.warehouseId,
      fromUserId: repair.assignedUserId,
      transactionType,
      remarks: payload.resolutionNotes,
    },
    userId,
    context
  );

  const completedRepair = await repairRepository.updateById(id, {
    status: REPAIR_STATUS.COMPLETED,
    completedAt: new Date(),
    outcome: payload.outcome,
    resolutionNotes: payload.resolutionNotes,
    metadata: payload.metadata || repair.metadata,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId: context.spaceId || null,
    actorId: userId,
    action: AUDIT_ACTIONS.COMPLETE,
    entityType: AUDIT_ENTITY_TYPES.REPAIR,
    entityId: id,
    before: repair,
    after: completedRepair,
    metadata: {
      outcome: payload.outcome,
      transactionType,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return completedRepair;
};

// Handles cancel repair.
const cancelRepair = async (
  id,
  payload,
  userId,
  context = {}
) => {
  const repair = await getRepairById(id);
  const decision = canCancelRepair(repair);

  if (!decision.allowed) {
    throw new AppError(decision.message, 400);
  }

  await inventoryTransactionService.createTransaction(
    {
      inventoryItemId: repair.inventoryItemId._id,
      fromWarehouseId: repair.warehouseId,
      fromUserId: repair.assignedUserId,
      transactionType:
        INVENTORY_TRANSACTION_TYPES.REPAIR_COMPLETED,
      remarks:
        payload.resolutionNotes ||
        "Repair request cancelled",
    },
    userId,
    context
  );

  const cancelledRepair = await repairRepository.updateById(id, {
    status: REPAIR_STATUS.CANCELLED,
    resolutionNotes: payload.resolutionNotes || "",
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId: context.spaceId || null,
    actorId: userId,
    action: AUDIT_ACTIONS.CANCEL,
    entityType: AUDIT_ENTITY_TYPES.REPAIR,
    entityId: id,
    before: repair,
    after: cancelledRepair,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return cancelledRepair;
};

module.exports = {
  createRepair,
  getRepairs,
  getRepairById,
  updateRepair,
  completeRepair,
  cancelRepair,
};


