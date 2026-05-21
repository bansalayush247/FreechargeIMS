const Joi = require("joi");

const {
  ASSET_REQUEST_PRIORITY,
} = require("../constants/assetRequest");

const createAssetRequestSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),

  requestedQuantity: Joi.number()
    .integer()
    .min(1)
    .default(1),

  businessJustification: Joi.string()
    .trim()
    .required(),

  remarks: Joi.string().trim().allow("").optional(),

  priority: Joi.string()
    .valid(...Object.values(ASSET_REQUEST_PRIORITY))
    .optional(),
});

const approvalSchema = Joi.object({
  remarks: Joi.string().trim().allow("").optional(),
});

const rejectionSchema = Joi.object({
  rejectionReason: Joi.string().trim().required(),
});

const getAssetRequestsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  employeeId: Joi.string().hex().length(24).optional(),

  productId: Joi.string().hex().length(24).optional(),

  status: Joi.string().optional(),

  priority: Joi.string().optional(),
});

module.exports = {
  createAssetRequestSchema,
  approvalSchema,
  rejectionSchema,
  getAssetRequestsSchema,
};

