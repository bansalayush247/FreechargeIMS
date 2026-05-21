const Joi = require("joi");

const {
  WAREHOUSE_TYPES,
} = require("../constants/warehouse");

const createWarehouseSchema = Joi.object({
  name: Joi.string().trim().required(),

  code: Joi.string().trim().uppercase().required(),

  type: Joi.string()
    .valid(...Object.values(WAREHOUSE_TYPES))
    .required(),

  managerUserId: Joi.string().optional(),

  address: Joi.object({
    line1: Joi.string().allow("", null),

    city: Joi.string().allow("", null),

    state: Joi.string().allow("", null),

    pincode: Joi.string().allow("", null),
  }).optional(),
});

const updateWarehouseSchema = Joi.object({
  name: Joi.string().trim(),

  type: Joi.string().valid(
    ...Object.values(WAREHOUSE_TYPES)
  ),

  managerUserId: Joi.string().allow(null),

  isActive: Joi.boolean(),

  address: Joi.object({
    line1: Joi.string().allow("", null),

    city: Joi.string().allow("", null),

    state: Joi.string().allow("", null),

    pincode: Joi.string().allow("", null),
  }),
});

module.exports = {
  createWarehouseSchema,
  updateWarehouseSchema,
};

