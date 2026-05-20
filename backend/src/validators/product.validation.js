const Joi = require("joi");

const { PRODUCT_ASSET_TYPES } = require("../constants/product.constant");

const createProductSchema = Joi.object({
  sku: Joi.string().trim().uppercase().required(),

  name: Joi.string().trim().required(),

  category: Joi.string().trim().required(),

  brand: Joi.string().allow("", null),

  model: Joi.string().allow("", null),

  specifications: Joi.object().optional(),

  assetType: Joi.string().valid(...Object.values(PRODUCT_ASSET_TYPES)).required(),

  minimumStock: Joi.number().min(0).optional(),

  isTrackable: Joi.boolean().optional(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim(),

  category: Joi.string().trim(),

  brand: Joi.string().allow("", null),

  model: Joi.string().allow("", null),

  specifications: Joi.object(),

  minimumStock: Joi.number().min(0),

  isTrackable: Joi.boolean(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
};