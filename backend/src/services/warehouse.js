const warehouseRepository = require(
  "../repositories/warehouse"
);
const auditLogService = require("./auditLog");

const logger = require("../config/logger");

const AppError = require("../utils/appError");
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");

const createWarehouse = async ({
  body,
  userId,
  spaceId,
  context = {},
}) => {
  const existingWarehouse =
    await warehouseRepository.findWarehouseByCode(
      spaceId,
      body.code
    );

  if (existingWarehouse) {
    throw new AppError(
      "Warehouse code already exists",
      400
    );
  }

  const warehouse =
    await warehouseRepository.createWarehouse({
      ...body,
      spaceId,
      createdBy: userId,
      updatedBy: userId,
    });

  logger.info(
    `Warehouse created warehouseId=${warehouse._id}`
  );

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITY_TYPES.WAREHOUSE,
    entityId: warehouse._id,
    before: null,
    after: warehouse,
    metadata: {
      code: warehouse.code,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return warehouse;
};

const getWarehouses = async ({
  spaceId,
  page,
  limit,
}) => {
  return warehouseRepository.getWarehouses({
    spaceId,
    page,
    limit,
  });
};

const updateWarehouse = async ({
  warehouseId,
  body,
  userId,
  context = {},
}) => {
  const warehouse =
    await warehouseRepository.findWarehouseById(
      warehouseId
    );

  if (!warehouse) {
    throw new AppError(
      "Warehouse not found",
      404
    );
  }

  const updatedWarehouse =
    await warehouseRepository.updateWarehouse(
      warehouseId,
      {
        ...body,
        updatedBy: userId,
      }
    );

  logger.info(
    `Warehouse updated warehouseId=${warehouseId}`
  );

  await auditLogService.recordAuditLog({
    spaceId: warehouse.spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: AUDIT_ENTITY_TYPES.WAREHOUSE,
    entityId: warehouseId,
    before: warehouse,
    after: updatedWarehouse,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return updatedWarehouse;
};

const deleteWarehouse = async ({
  warehouseId,
  userId,
  context = {},
}) => {
  const warehouse =
    await warehouseRepository.findWarehouseById(
      warehouseId
    );

  if (!warehouse) {
    throw new AppError(
      "Warehouse not found",
      404
    );
  }

  const deletedWarehouse =
    await warehouseRepository.softDeleteWarehouse(
    warehouseId,
    userId
  );

  logger.info(
    `Warehouse deleted warehouseId=${warehouseId}`
  );

  await auditLogService.recordAuditLog({
    spaceId: warehouse.spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.DELETE,
    entityType: AUDIT_ENTITY_TYPES.WAREHOUSE,
    entityId: warehouseId,
    before: warehouse,
    after: deletedWarehouse,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });
};

module.exports = {
  createWarehouse,
  getWarehouses,
  updateWarehouse,
  deleteWarehouse,
};


