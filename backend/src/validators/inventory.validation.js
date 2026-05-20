const Joi = require("joi");

const {
  INVENTORY_STATUS,
  INVENTORY_CONDITION,
} = require("../constants/inventory.constant");

const createInventoryItemSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),

  warehouseId: Joi.string().hex().length(24).required(),

  assignedUserId: Joi.string().hex().length(24).optional().allow(null),

  serialNumber: Joi.string().trim().required(),

  assetTag: Joi.string().trim().required(),

  qrCode: Joi.string().trim().required(),

  status: Joi.string()
    .valid(...Object.values(INVENTORY_STATUS))
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

  serialNumber: Joi.string().trim().optional(),

  assetTag: Joi.string().trim().optional(),

  qrCode: Joi.string().trim().optional(),

  status: Joi.string()
    .valid(...Object.values(INVENTORY_STATUS))
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
    .valid(...Object.values(INVENTORY_STATUS))
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