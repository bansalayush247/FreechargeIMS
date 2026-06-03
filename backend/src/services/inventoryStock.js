const mongoose = require("mongoose");

const Product = require("../models/product");
const inventoryStockRepository = require("../repositories/inventoryStock");
const inventoryTransactionRepository = require("../repositories/inventoryTransaction");
const auditLogService = require("./auditLog");
const AppError = require("../utils/appError");
const { PRODUCT_TRACKING_TYPES } = require("../constants/product");
const { INVENTORY_TRANSACTION_TYPES } = require("../constants/inventoryTransaction");
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");
const { INVENTORY_STOCK_ALERT_STATUS } = require("../constants/inventory");

const assertBulkProduct = async (productId) => {
  const product = await Product.findOne({ _id: productId, isDeleted: false }).lean();
  if (!product) throw new AppError("Product not found", 404);
  if (product.trackingType !== PRODUCT_TRACKING_TYPES.BULK) {
    throw new AppError("Inventory stock is only supported for BULK products", 400);
  }
  return product;
};

const getInventoryStocks = (filters) => inventoryStockRepository.paginate(filters);

const getLowStockInventoryStocks = (filters) => inventoryStockRepository.findLowStock(filters);

const getOutOfStockInventoryStocks = (filters) => inventoryStockRepository.findOutOfStock(filters);

const getProcurementRequiredInventoryStocks = (filters) => inventoryStockRepository.findProcurementRequired(filters);

const getInventoryStockByProductId = async (productId, context = {}) => {
  const stock = await inventoryStockRepository.findByProductId(productId, { spaceId: context.spaceId });
  if (!stock) throw new AppError("Inventory stock not found", 404);
  return {
    ...stock,
    alertStatus: Number(stock.availableQuantity || 0) <= 0
      ? INVENTORY_STOCK_ALERT_STATUS.OUT_OF_STOCK
      : Number(stock.reorderQuantity || 0) > 0 && Number(stock.availableQuantity || 0) <= Number(stock.reorderQuantity || 0)
        ? INVENTORY_STOCK_ALERT_STATUS.PROCUREMENT_REQUIRED
        : Number(stock.reorderLevel || 0) > 0 && Number(stock.availableQuantity || 0) <= Number(stock.reorderLevel || 0)
          ? INVENTORY_STOCK_ALERT_STATUS.LOW_STOCK
          : null,
  };
};

const adjustInventoryStock = async (payload, userId, context = {}) => {
  await assertBulkProduct(payload.productId);
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let stock = await inventoryStockRepository.findByProductId(payload.productId, {
      session,
      lean: false,
      spaceId: context.spaceId,
    });

    if (!stock) {
      stock = await inventoryStockRepository.create(
        {
          spaceId: context.spaceId,
          productId: payload.productId,
          reorderLevel: payload.reorderLevel || 0,
          reorderQuantity: payload.reorderQuantity || 0,
          availableQuantity: 0,
          reservedQuantity: 0,
          allocatedQuantity: 0,
          createdBy: userId,
          updatedBy: userId,
        },
        { session }
      );
    }

    const before = stock.toObject();
    const delta = Number(payload.quantityDelta || 0);
    const nextAvailable = Number(stock.availableQuantity || 0) + delta;

    if (nextAvailable < 0) {
      throw new AppError("Inventory stock cannot become negative", 400);
    }

    stock.availableQuantity = nextAvailable;
    stock.updatedBy = userId;
    await stock.save({ session });

    const transaction = await inventoryTransactionRepository.create(
      {
        spaceId: context.spaceId,
        inventoryStockId: stock._id,
        productId: stock.productId,
        transactionType: payload.transactionType || (delta >= 0 ? INVENTORY_TRANSACTION_TYPES.STOCK_IN : INVENTORY_TRANSACTION_TYPES.STOCK_OUT),
        quantity: Math.abs(delta),
        remarks: payload.remarks || "",
        previousStatus: "AVAILABLE",
        newStatus: "AVAILABLE",
        performedBy: userId,
      },
      session
    );

    await auditLogService.recordAuditLog(
      {
        spaceId: context.spaceId || null,
        actorId: userId,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.INVENTORY_ITEM,
        entityId: stock._id,
        before,
        after: stock.toObject(),
        metadata: {
          transactionId: transaction._id,
          quantityDelta: delta,
        },
        ipAddress: context.ipAddress || "",
        userAgent: context.userAgent || "",
      },
      session
    );

    await session.commitTransaction();

    const stockObject = stock.toObject();

    return {
      ...stockObject,
      alertStatus: Number(stockObject.availableQuantity || 0) <= 0
        ? INVENTORY_STOCK_ALERT_STATUS.OUT_OF_STOCK
        : Number(stockObject.reorderQuantity || 0) > 0 && Number(stockObject.availableQuantity || 0) <= Number(stockObject.reorderQuantity || 0)
          ? INVENTORY_STOCK_ALERT_STATUS.PROCUREMENT_REQUIRED
          : Number(stockObject.reorderLevel || 0) > 0 && Number(stockObject.availableQuantity || 0) <= Number(stockObject.reorderLevel || 0)
            ? INVENTORY_STOCK_ALERT_STATUS.LOW_STOCK
            : null,
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  getInventoryStocks,
  getLowStockInventoryStocks,
  getOutOfStockInventoryStocks,
  getProcurementRequiredInventoryStocks,
  getInventoryStockByProductId,
  adjustInventoryStock,
  assertBulkProduct,
};
