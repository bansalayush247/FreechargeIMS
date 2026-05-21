const inventoryService = require("../services/inventory");

const asyncHandler = require("../utils/asyncHandler");

const {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  getInventoryItemsSchema,
} = require("../validators/inventory");

const createInventoryItem = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
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

const getInventoryItems = asyncHandler(async (req, res) => {
  const { error, value } = getInventoryItemsSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const result = await inventoryService.getInventoryItems(value);

  return res.status(200).json({
    success: true,
    message: "Inventory items fetched successfully",
    data: result,
  });
});

const getInventoryItemById = asyncHandler(async (req, res) => {
  const inventoryItem = await inventoryService.getInventoryItemById(
    req.params.id
  );

  return res.status(200).json({
    success: true,
    message: "Inventory item fetched successfully",
    data: inventoryItem,
  });
});

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
  updateInventoryItem,
  deleteInventoryItem,
};
