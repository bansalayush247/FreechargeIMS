const Joi = require("joi");

const {
  INVENTORY_TRANSACTION_TYPE_VALUES,
  normalizeInventoryTransactionType,
} = require("../constants/inventoryTransaction");

const createTransactionSchema = Joi.object({
  inventoryItemId: Joi.string().hex().length(24).required(),

  fromWarehouseId: Joi.string().hex().length(24).allow(null),
  // aliases for migration
  fromStorageLocationId: Joi.string().hex().length(24).allow(null),

  toWarehouseId: Joi.string().hex().length(24).allow(null),

  toStorageLocationId: Joi.string().hex().length(24).allow(null),

  fromUserId: Joi.string().hex().length(24).allow(null),

  toUserId: Joi.string().hex().length(24).allow(null),

  fromMerchantId: Joi.string().hex().length(24).allow(null),

  toMerchantId: Joi.string().hex().length(24).allow(null),

  newStatus: Joi.string().optional(),

  transactionType: Joi.string()
    .valid(...INVENTORY_TRANSACTION_TYPE_VALUES)
    .custom((value) => normalizeInventoryTransactionType(value))
    .required(),

  remarks: Joi.string().trim().allow("").optional(),
});

const getTransactionsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  inventoryItemId: Joi.string().hex().length(24).optional(),

  transactionType: Joi.string()
    .valid(...INVENTORY_TRANSACTION_TYPE_VALUES)
    .custom((value) => normalizeInventoryTransactionType(value))
    .optional(),

  performedBy: Joi.string().hex().length(24).optional(),

  warehouseId: Joi.string().hex().length(24).optional(),
  // alias for migration
  storageLocationId: Joi.string().hex().length(24).optional(),

  startDate: Joi.date().optional(),

  endDate: Joi.date().optional(),
});

module.exports = {
  createTransactionSchema,
  getTransactionsSchema,
};

