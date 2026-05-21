const Joi = require("joi");

const {
  INVENTORY_STATUS_VALUES,
  normalizeInventoryStatus,
  INVENTORY_CONDITION,
} = require("../constants/inventory");

const createInventoryItemSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),

  warehouseId: Joi.string().hex().length(24).required(),

  assignedUserId: Joi.string().hex().length(24).optional().allow(null),

  quantity: Joi.number().integer().min(1).optional(),

  serialNumber: Joi.string().trim().optional().allow(null, ""),

  assetTag: Joi.string().trim().optional().allow(null, ""),

  qrCode: Joi.string().trim().optional().allow(null, ""),

  status: Joi.string()
    .valid(...INVENTORY_STATUS_VALUES)
    .custom((value) => normalizeInventoryStatus(value))
    .optional(),

  purchaseDate: Joi.date().optional(),

  warrantyExpiry: Joi.date().optional(),

  condition: Joi.string()
    .valid(...Object.values(INVENTORY_CONDITION))
    .optional(),

  remarks: Joi.string().trim().allow("").optional(),
});

const updateInventoryItemSchema = Joi.object({
  productId: Joi.string().hex().length(24).optional(),

  warehouseId: Joi.string().hex().length(24).optional(),

  assignedUserId: Joi.string().hex().length(24).allow(null).optional(),

  quantity: Joi.number().integer().min(0).optional(),

  serialNumber: Joi.string().trim().optional().allow(null, ""),

  assetTag: Joi.string().trim().optional().allow(null, ""),

  qrCode: Joi.string().trim().optional().allow(null, ""),

  status: Joi.string()
    .valid(...INVENTORY_STATUS_VALUES)
    .custom((value) => normalizeInventoryStatus(value))
    .optional(),

  purchaseDate: Joi.date().optional(),

  warrantyExpiry: Joi.date().optional(),

  condition: Joi.string()
    .valid(...Object.values(INVENTORY_CONDITION))
    .optional(),

  remarks: Joi.string().trim().allow("").optional(),
});

const getInventoryItemsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  status: Joi.string()
    .valid(...INVENTORY_STATUS_VALUES)
    .custom((value) => normalizeInventoryStatus(value))
    .optional(),

  warehouseId: Joi.string().hex().length(24).optional(),

  productId: Joi.string().hex().length(24).optional(),

  search: Joi.string().trim().optional(),
});

module.exports = {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  getInventoryItemsSchema,
};

