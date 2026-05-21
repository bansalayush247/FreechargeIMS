const mongoose = require("mongoose");

const inventoryRepository = require("../repositories/inventory");
const auditLogService = require("./auditLog");

const Product = require("../models/product");
const Warehouse = require("../models/warehouse");
const {PRODUCT_ASSET_TYPES,} = require("../constants/product");

const AppError = require("../utils/appError");
const logger = require("../config/logger");
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");

const ensureSpaceScopedReferences = (
  product,
  warehouse,
  spaceId
) => {
  if (!spaceId) {
    throw new AppError("Space ID is required", 400);
  }

  const requestedSpaceId = String(spaceId);

  if (String(product.spaceId) !== requestedSpaceId) {
    throw new AppError("Product does not belong to the requested space", 400);
  }

  if (String(warehouse.spaceId) !== requestedSpaceId) {
    throw new AppError("Warehouse does not belong to the requested space", 400);
  }
};

const sanitizeIdentifier = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();

  return trimmed || null;
};

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

const assertConsumablePayload = (payload) => {
  if (
    payload.serialNumber !== undefined ||
    payload.assetTag !== undefined ||
    payload.qrCode !== undefined ||
    payload.assignedUserId !== undefined
  ) {
    throw new AppError(
      "Consumable inventory does not support serialNumber, assetTag, qrCode, or assignedUserId",
      400
    );
  }
};

const assertSerializedPayload = (payload) => {
  const serialNumber = sanitizeIdentifier(payload.serialNumber);
  const assetTag = sanitizeIdentifier(payload.assetTag);
  const qrCode = sanitizeIdentifier(payload.qrCode);

  if (!serialNumber || !assetTag || !qrCode) {
    throw new AppError(
      "serialNumber, assetTag and qrCode are required for non-consumable products",
      400
    );
  }

  return {
    serialNumber,
    assetTag,
    qrCode,
  };
};

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

  ensureSpaceScopedReferences(
    product,
    warehouse,
    context.spaceId
  );

  const quantity = payload.quantity ?? 1;

  if (!isPositiveInteger(quantity)) {
    throw new AppError("quantity must be a positive integer", 400);
  }

  if (product.assetType === PRODUCT_ASSET_TYPES.CONSUMABLE) {
    assertConsumablePayload(payload);

    const existingConsumable = await inventoryRepository.findOne({
      productId: payload.productId,
      warehouseId: payload.warehouseId,
      isDeleted: false,
      assignedUserId: null,
    });

    if (existingConsumable) {
      const updatedItem = await inventoryRepository.updateById(
        existingConsumable._id,
        {
          quantity: (existingConsumable.quantity || 0) + quantity,
          status: payload.status || existingConsumable.status,
          purchaseDate:
            payload.purchaseDate || existingConsumable.purchaseDate,
          warrantyExpiry:
            payload.warrantyExpiry || existingConsumable.warrantyExpiry,
          condition: payload.condition || existingConsumable.condition,
          remarks:
            payload.remarks !== undefined
              ? payload.remarks
              : existingConsumable.remarks,
          updatedBy: userId,
        }
      );

      await auditLogService.recordAuditLog({
        spaceId: context.spaceId || null,
        actorId: userId,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.INVENTORY_ITEM,
        entityId: updatedItem._id,
        before: existingConsumable,
        after: updatedItem,
        metadata: {
          productId: payload.productId,
          warehouseId: payload.warehouseId,
          stockInQuantity: quantity,
        },
        ipAddress: context.ipAddress || "",
        userAgent: context.userAgent || "",
      });

      return updatedItem;
    }

    const inventoryItem = await inventoryRepository.create({
      ...payload,
      serialNumber: null,
      assetTag: null,
      qrCode: null,
      assignedUserId: null,
      quantity,
      createdBy: userId,
    });

    logger.info("Consumable inventory item created successfully", {
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
        stockInQuantity: quantity,
      },
      ipAddress: context.ipAddress || "",
      userAgent: context.userAgent || "",
    });

    return inventoryItem;
  }

  const identifiers = assertSerializedPayload(payload);

  if (quantity !== 1) {
    throw new AppError(
      "quantity must be 1 for non-consumable products",
      400
    );
  }

  const inventoryItem = await inventoryRepository.create({
    ...payload,
    ...identifiers,
    quantity: 1,
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

  const effectiveProductId =
    payload.productId || existingInventoryItem.productId;
  const effectiveWarehouseId =
    payload.warehouseId || existingInventoryItem.warehouseId;

  const [effectiveProduct, effectiveWarehouse] = await Promise.all([
    Product.findOne({
      _id: effectiveProductId,
      isDeleted: false,
    }).lean(),
    Warehouse.findOne({
      _id: effectiveWarehouseId,
      isDeleted: false,
    }).lean(),
  ]);

  if (!effectiveProduct) {
    throw new AppError("Product not found", 404);
  }

  if (!effectiveWarehouse) {
    throw new AppError("Warehouse not found", 404);
  }

  ensureSpaceScopedReferences(
    effectiveProduct,
    effectiveWarehouse,
    context.spaceId
  );

  const isConsumable =
    effectiveProduct.assetType === PRODUCT_ASSET_TYPES.CONSUMABLE;

  if (isConsumable) {
    assertConsumablePayload(payload);
  } else {
    if (payload.quantity !== undefined && payload.quantity !== 1) {
      throw new AppError(
        "quantity must remain 1 for non-consumable products",
        400
      );
    }
  }

  const updatePayload = {
    ...payload,
    updatedBy: userId,
  };

  if (isConsumable) {
    updatePayload.serialNumber = null;
    updatePayload.assetTag = null;
    updatePayload.qrCode = null;
    updatePayload.assignedUserId = null;
  } else {
    updatePayload.quantity = 1;
    if (payload.serialNumber !== undefined) {
      updatePayload.serialNumber = sanitizeIdentifier(
        payload.serialNumber
      );
    }
    if (payload.assetTag !== undefined) {
      updatePayload.assetTag = sanitizeIdentifier(
        payload.assetTag
      );
    }
    if (payload.qrCode !== undefined) {
      updatePayload.qrCode = sanitizeIdentifier(
        payload.qrCode
      );
    }
  }

  const updatedInventoryItem = await inventoryRepository.updateById(
    id,
    updatePayload
  );

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


