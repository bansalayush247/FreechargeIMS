const inventoryService = require("../services/inventory");
const inventoryStockService = require("../services/inventoryStock");

const asyncHandler = require("../utils/asyncHandler");

const {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  getInventoryItemsSchema,
  getInventoryStocksSchema,
  adjustInventoryStockSchema,
} = require("../validators/inventory");

// Handles create inventory item.
const createInventoryItem = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  // Accept legacy or new alias: storageLocationId -> warehouseId
  if (!req.body.warehouseId && req.body.storageLocationId) {
    req.body.warehouseId = req.body.storageLocationId;
  }

  const { error, value } = createInventoryItemSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const inventoryItem = await inventoryService.createInventoryItem(
    value,
    userId,
    {
      spaceId: req.spaceId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    }
  );

  return res.status(201).json({
    success: true,
    message: "Inventory item created successfully",
    data: inventoryItem,
  });
});

// Handles get inventory items.
const getInventoryItems = asyncHandler(async (req, res) => {
  // Accept storageLocationId alias in query params
  if (!req.query.warehouseId && req.query.storageLocationId) {
    req.query.warehouseId = req.query.storageLocationId;
  }

  const { error, value } = getInventoryItemsSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const result = await inventoryService.getInventoryItems({
    ...value,
    spaceId: req.spaceId,
  });

  return res.status(200).json({
    success: true,
    message: "Inventory items fetched successfully",
    data: result,
  });
});

// Handles get inventory item by id.
const getInventoryItemById = asyncHandler(async (req, res) => {
  const inventoryItem = await inventoryService.getInventoryItemById(
    req.params.id,
    { spaceId: req.spaceId }
  );

  return res.status(200).json({
    success: true,
    message: "Inventory item fetched successfully",
    data: inventoryItem,
  });
});

const getInventoryAssetById = asyncHandler(async (req, res) => {
  const inventoryItem = await inventoryService.getInventoryAssetById(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Inventory asset fetched successfully",
    data: inventoryItem,
  });
});

const getInventoryItemQrCode = asyncHandler(async (req, res) => {
  const qrImageBuffer = await inventoryService.getInventoryItemQrCode(
    req.params.id,
    { spaceId: req.spaceId }
  );

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "private, max-age=300");

  return res.status(200).send(qrImageBuffer);
});

const getInventoryStocks = asyncHandler(async (req, res) => {
  const { error, value } = getInventoryStocksSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const result = await inventoryStockService.getInventoryStocks({ ...value, spaceId: req.spaceId });

  return res.status(200).json({
    success: true,
    message: "Inventory stocks fetched successfully",
    data: result,
  });
});

const getLowStockInventoryStocks = asyncHandler(async (req, res) => {
  const { error, value } = getInventoryStocksSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const result = await inventoryStockService.getLowStockInventoryStocks({ ...value, spaceId: req.spaceId });

  return res.status(200).json({
    success: true,
    message: "Low stock inventory fetched successfully",
    data: result,
  });
});

const getOutOfStockInventoryStocks = asyncHandler(async (req, res) => {
  const { error, value } = getInventoryStocksSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const result = await inventoryStockService.getOutOfStockInventoryStocks({ ...value, spaceId: req.spaceId });

  return res.status(200).json({
    success: true,
    message: "Out of stock inventory fetched successfully",
    data: result,
  });
});

const getProcurementRequiredInventoryStocks = asyncHandler(async (req, res) => {
  const { error, value } = getInventoryStocksSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const result = await inventoryStockService.getProcurementRequiredInventoryStocks({ ...value, spaceId: req.spaceId });

  return res.status(200).json({
    success: true,
    message: "Procurement required inventory fetched successfully",
    data: result,
  });
});

const getInventoryStockByProductId = asyncHandler(async (req, res) => {
  const stock = await inventoryStockService.getInventoryStockByProductId(req.params.productId, { spaceId: req.spaceId });

  return res.status(200).json({
    success: true,
    message: "Inventory stock fetched successfully",
    data: stock,
  });
});

const adjustInventoryStock = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } = adjustInventoryStockSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const stock = await inventoryStockService.adjustInventoryStock(value, userId, {
    spaceId: req.spaceId,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return res.status(200).json({
    success: true,
    message: "Inventory stock updated successfully",
    data: stock,
  });
});

// Handles update inventory item.
const updateInventoryItem = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } = updateInventoryItemSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const inventoryItem = await inventoryService.updateInventoryItem(
    req.params.id,
    value,
    userId,
    {
      spaceId: req.spaceId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    }
  );

  return res.status(200).json({
    success: true,
    message: "Inventory item updated successfully",
    data: inventoryItem,
  });
});

// Handles delete inventory item.
const deleteInventoryItem = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  await inventoryService.deleteInventoryItem(
    req.params.id,
    userId,
    {
      spaceId: req.spaceId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    }
  );

  return res.status(200).json({
    success: true,
    message: "Inventory item deleted successfully",
  });
});

module.exports = {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  getInventoryAssetById,
  getInventoryItemQrCode,
  getInventoryStocks,
  getLowStockInventoryStocks,
  getOutOfStockInventoryStocks,
  getProcurementRequiredInventoryStocks,
  getInventoryStockByProductId,
  adjustInventoryStock,
  updateInventoryItem,
  deleteInventoryItem,
};
