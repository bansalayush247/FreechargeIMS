const Joi = require("joi");

const { PRODUCT_ASSET_TYPES, PRODUCT_CATEGORIES } = require("../constants/product");

const PRODUCT_CATEGORY_VALUES = Object.values(PRODUCT_CATEGORIES);

const createProductSchema = Joi.object({
  sku: Joi.string().trim().uppercase().required(),

  name: Joi.string().trim().required(),

  category: Joi.string().trim().valid(...PRODUCT_CATEGORY_VALUES).required(),

  brand: Joi.string().allow("", null),

  model: Joi.string().allow("", null),

  specifications: Joi.object().optional(),

  imageUrl: Joi.string().trim().allow("", null).optional(),

  assetType: Joi.string().valid(...Object.values(PRODUCT_ASSET_TYPES)).required(),

  minimumStock: Joi.number().min(0).optional(),

  isTrackable: Joi.boolean().optional(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim(),

  category: Joi.string().trim().valid(...PRODUCT_CATEGORY_VALUES),

  brand: Joi.string().allow("", null),

  model: Joi.string().allow("", null),

  specifications: Joi.object(),

  imageUrl: Joi.string().trim().allow("", null),

  minimumStock: Joi.number().min(0),

  isTrackable: Joi.boolean(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
};

