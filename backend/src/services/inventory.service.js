const mongoose = require("mongoose");

const inventoryRepository = require("../repositories/inventory.repository");
const auditLogService = require("./auditLog.service");

const Product = require("../models/product.model");
const Warehouse = require("../models/warehouse.model");

const AppError = require("../utils/appError");
const logger = require("../config/logger");
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog.constant");

const createInventoryItem = async (
  payload,
  userId,
  context = {}
) => {
  logger.info("Creating inventory item");

  const [product, warehouse] = await Promise.all([
    Product.findOne({
      _id: payload.productId,
      isDeleted: false,
    }).lean(),

    Warehouse.findOne({
      _id: payload.warehouseId,
      isDeleted: false,
    }).lean(),
  ]);

  if (!product) {
    logger.warn("Product not found");

    throw new AppError("Product not found", 404);
  }

  if (!warehouse) {
    logger.warn("Warehouse not found");

    throw new AppError("Warehouse not found", 404);
  }

  const inventoryItem = await inventoryRepository.create({
    ...payload,
    createdBy: userId,
  });

  logger.info("Inventory item created successfully", {
    inventoryItemId: inventoryItem._id,
  });

  await auditLogService.recordAuditLog({
    spaceId: context.spaceId || null,
    actorId: userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITY_TYPES.INVENTORY_ITEM,
    entityId: inventoryItem._id,
    before: null,
    after: inventoryItem,
    metadata: {
      productId: payload.productId,
      warehouseId: payload.warehouseId,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return inventoryItem;
};

const getInventoryItems = async (query) => {
  logger.info("Fetching inventory items");

  return inventoryRepository.paginate(query);
};

const getInventoryItemById = async (id) => {
  logger.info("Fetching inventory item by id", { id });

  const inventoryItem = await inventoryRepository.findById(id);

  if (!inventoryItem) {
    logger.warn("Inventory item not found", { id });

    throw new AppError("Inventory item not found", 404);
  }

  return inventoryItem;
};

const updateInventoryItem = async (
  id,
  payload,
  userId,
  context = {}
) => {
  logger.info("Updating inventory item", { id });

  const existingInventoryItem = await inventoryRepository.findById(id);

  if (!existingInventoryItem) {
    logger.warn("Inventory item not found", { id });

    throw new AppError("Inventory item not found", 404);
  }

  if (payload.productId) {
    const product = await Product.findOne({
      _id: payload.productId,
      isDeleted: false,
    }).lean();

    if (!product) {
      throw new AppError("Product not found", 404);
    }
  }

  if (payload.warehouseId) {
    const warehouse = await Warehouse.findOne({
      _id: payload.warehouseId,
      isDeleted: false,
    }).lean();

    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }
  }

  const updatedInventoryItem = await inventoryRepository.updateById(id, {
    ...payload,
    updatedBy: userId,
  });

  logger.info("Inventory item updated successfully", { id });

  await auditLogService.recordAuditLog({
    spaceId: context.spaceId || null,
    actorId: userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: AUDIT_ENTITY_TYPES.INVENTORY_ITEM,
    entityId: id,
    before: existingInventoryItem,
    after: updatedInventoryItem,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return updatedInventoryItem;
};

const deleteInventoryItem = async (
  id,
  userId,
  context = {}
) => {
  logger.info("Deleting inventory item", { id });

  const inventoryItem = await inventoryRepository.findById(id);

  if (!inventoryItem) {
    logger.warn("Inventory item not found", { id });

    throw new AppError("Inventory item not found", 404);
  }

  const deletedInventoryItem =
    await inventoryRepository.updateById(id, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: new mongoose.Types.ObjectId(userId),
  });

  logger.info("Inventory item deleted successfully", { id });

  await auditLogService.recordAuditLog({
    spaceId: context.spaceId || null,
    actorId: userId,
    action: AUDIT_ACTIONS.DELETE,
    entityType: AUDIT_ENTITY_TYPES.INVENTORY_ITEM,
    entityId: id,
    before: inventoryItem,
    after: deletedInventoryItem,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });
};

module.exports = {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
};
