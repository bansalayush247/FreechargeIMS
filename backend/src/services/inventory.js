const mongoose = require("mongoose");

const inventoryRepository = require("../repositories/inventory");
const auditLogService = require("./auditLog");

const Product = require("../models/product");
const Warehouse = require("../models/warehouse");
const Space = require("../models/space");
const InventoryItem = require("../models/inventory");
const {PRODUCT_ASSET_TYPES,} = require("../constants/product");
const { SPACE_CODES, SPACE_TYPES } = require("../constants/space");
const { INVENTORY_STATUS } = require("../constants/inventory");

const AppError = require("../utils/appError");
const logger = require("../config/logger");
const {
  normalizeInventoryStatus,
} = require("../constants/inventory");
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

  // Allow global products: only enforce product-space if product declares a spaceId
  if (product.spaceId && String(product.spaceId) !== requestedSpaceId) {
    throw new AppError("Product does not belong to the requested space", 400);
  }

  if (String(warehouse.spaceId) !== requestedSpaceId) {
    throw new AppError("Warehouse does not belong to the requested space", 400);
  }
};

const resolveSourceSpaceCode = (space) => {
  if (!space || !space.code) {
    return null;
  }

  const normalizedCode = String(space.code).toUpperCase();

  if (normalizedCode === SPACE_CODES.IT_TEAM || normalizedCode === SPACE_CODES.WAREHOUSE) {
    return null;
  }

  if (space.type === SPACE_TYPES.EMPLOYEE) {
    return SPACE_CODES.IT_TEAM;
  }

  if (space.type === SPACE_TYPES.MERCHANT) {
    return SPACE_CODES.WAREHOUSE;
  }

  return null;
};

const getAvailableSourceQuantity = async (productId, sourceSpaceId) => {
  const warehouses = await Warehouse.find({
    spaceId: sourceSpaceId,
    isDeleted: false,
  })
    .select("_id")
    .lean();

  if (!warehouses.length) {
    return 0;
  }

  const warehouseIds = warehouses.map((warehouse) => warehouse._id);

  const aggregateResult = await InventoryItem.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        warehouseId: { $in: warehouseIds },
        isDeleted: false,
        status: INVENTORY_STATUS.IN_STOCK,
      },
    },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: "$quantity" },
      },
    },
  ]);

  return aggregateResult[0]?.totalQuantity || 0;
};

const decrementSourceStock = async ({
  productId,
  sourceSpaceId,
  quantity,
  userId,
  session,
}) => {
  const warehouses = await Warehouse.find({
    spaceId: sourceSpaceId,
    isDeleted: false,
  })
    .select("_id")
    .session(session)
    .lean();

  const warehouseIds = warehouses.map((warehouse) => warehouse._id);

  if (!warehouseIds.length) {
    throw new AppError("No source warehouses found for the selected space", 404);
  }

  const sourceItems = await InventoryItem.find({
    productId,
    warehouseId: { $in: warehouseIds },
    isDeleted: false,
    status: INVENTORY_STATUS.IN_STOCK,
  })
    .sort({ createdAt: 1, _id: 1 })
    .session(session);

  let remainingQuantity = quantity;
  const decrementedItems = [];

  for (const sourceItem of sourceItems) {
    if (remainingQuantity <= 0) {
      break;
    }

    const currentQuantity = Number(sourceItem.quantity || 0);

    if (currentQuantity <= 0) {
      continue;
    }

    const deductedQuantity = Math.min(currentQuantity, remainingQuantity);

    sourceItem.quantity = currentQuantity - deductedQuantity;
    sourceItem.updatedBy = userId;

    if (sourceItem.quantity <= 0) {
      sourceItem.quantity = 0;
    }

    await sourceItem.save({ session });

    decrementedItems.push({
      _id: sourceItem._id,
      quantity: deductedQuantity,
      remainingQuantity: sourceItem.quantity,
    });

    remainingQuantity -= deductedQuantity;
  }

  if (remainingQuantity > 0) {
    throw new AppError("Requested quantity exceeds available stock", 400);
  }

  return decrementedItems;
};

// Handles sanitize identifier.
const sanitizeIdentifier = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();

  return trimmed || null;
};

// Handles is positive integer.
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

// Handles assert consumable payload.
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

// Handles assert serialized payload.
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

// Handles create inventory item.
const createInventoryItem = async (
  payload,
  userId,
  context = {}
) => {
  logger.info("Creating inventory item");

  const quantity = payload.quantity ?? 1;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [product, warehouse, targetSpace] = await Promise.all([
      Product.findOne({
        _id: payload.productId,
        isDeleted: false,
      }).lean(),

      Warehouse.findOne({
        _id: payload.warehouseId,
        isDeleted: false,
      }).lean(),

      Space.findOne({
        _id: context.spaceId,
        isDeleted: false,
      })
        .select("_id name code type")
        .lean(),
    ]);

    if (!product) {
      logger.warn("Product not found");

      throw new AppError("Product not found", 404);
    }

    if (!warehouse) {
      logger.warn("Warehouse not found");

      throw new AppError("Warehouse not found", 404);
    }

    if (!targetSpace) {
      throw new AppError("Space not found", 404);
    }

    ensureSpaceScopedReferences(product, warehouse, context.spaceId);

    const sourceSpaceCode = resolveSourceSpaceCode(targetSpace);
    let sourceSpace = null;

    if (sourceSpaceCode) {
      sourceSpace = await Space.findOne({
        code: sourceSpaceCode,
        isDeleted: false,
      })
        .select("_id name code")
        .lean();

      if (!sourceSpace) {
        throw new AppError(`${sourceSpaceCode} space not found`, 404);
      }

      const availableQuantity = await getAvailableSourceQuantity(product._id, sourceSpace._id);

      if (quantity > availableQuantity) {
        throw new AppError(
          `Requested quantity exceeds available stock in ${sourceSpace.name}`,
          400
        );
      }
    }

    if (!isPositiveInteger(quantity)) {
      throw new AppError("quantity must be a positive integer", 400);
    }

    if (product.assetType === PRODUCT_ASSET_TYPES.CONSUMABLE) {
      assertConsumablePayload(payload);

      if (sourceSpace) {
        await decrementSourceStock({
          productId: product._id,
          sourceSpaceId: sourceSpace._id,
          quantity,
          userId,
          session,
        });
      }

      const existingConsumable = await InventoryItem.findOne({
        productId: payload.productId,
        warehouseId: payload.warehouseId,
        isDeleted: false,
        assignedUserId: null,
      }).session(session);

      if (existingConsumable) {
        const beforeItem = existingConsumable.toObject();
        existingConsumable.quantity = (existingConsumable.quantity || 0) + quantity;
        existingConsumable.status = payload.status || existingConsumable.status;
        existingConsumable.purchaseDate = payload.purchaseDate || existingConsumable.purchaseDate;
        existingConsumable.warrantyExpiry = payload.warrantyExpiry || existingConsumable.warrantyExpiry;
        existingConsumable.condition = payload.condition || existingConsumable.condition;
        existingConsumable.remarks = payload.remarks !== undefined ? payload.remarks : existingConsumable.remarks;
        existingConsumable.updatedBy = userId;

        const updatedItem = await existingConsumable.save({ session });

        await auditLogService.recordAuditLog({
          spaceId: context.spaceId || null,
          actorId: userId,
          action: AUDIT_ACTIONS.UPDATE,
          entityType: AUDIT_ENTITY_TYPES.INVENTORY_ITEM,
          entityId: updatedItem._id,
          before: beforeItem,
          after: updatedItem.toObject(),
          metadata: {
            productId: payload.productId,
            warehouseId: payload.warehouseId,
            stockInQuantity: quantity,
          },
          ipAddress: context.ipAddress || "",
          userAgent: context.userAgent || "",
        }, session);

        await session.commitTransaction();
        return updatedItem.toObject();
      }

      const inventoryItem = await inventoryRepository.create({
        ...payload,
        serialNumber: null,
        assetTag: null,
        qrCode: null,
        assignedUserId: null,
        quantity,
        createdBy: userId,
      }, { session });

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
      }, session);

      await session.commitTransaction();
      return inventoryItem;
    }

    const identifiers = assertSerializedPayload(payload);

    if (quantity !== 1) {
      throw new AppError(
        "quantity must be 1 for non-consumable products",
        400
      );
    }

    if (sourceSpace) {
      await decrementSourceStock({
        productId: product._id,
        sourceSpaceId: sourceSpace._id,
        quantity: 1,
        userId,
        session,
      });
    }

    if (payload.status) {
      payload.status = normalizeInventoryStatus(payload.status);
    }

    const inventoryItem = await inventoryRepository.create({
      ...payload,
      ...identifiers,
      quantity: 1,
      createdBy: userId,
    }, { session });

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
    }, session);

    await session.commitTransaction();
    return inventoryItem;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }

    throw error;
  } finally {
    session.endSession();
  }
};

// Handles get inventory items.
const getInventoryItems = async (query) => {
  logger.info("Fetching inventory items");

  return inventoryRepository.paginate(query);
};

// Handles get inventory item by id.
const getInventoryItemById = async (id) => {
  logger.info("Fetching inventory item by id", { id });

  const inventoryItem = await inventoryRepository.findById(id);

  if (!inventoryItem) {
    logger.warn("Inventory item not found", { id });

    throw new AppError("Inventory item not found", 404);
  }

  return inventoryItem;
};

// Handles update inventory item.
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

// Handles delete inventory item.
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


