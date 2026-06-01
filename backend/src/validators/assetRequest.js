const Joi = require("joi");

const {
  ASSET_REQUEST_PRIORITY,
  ASSET_REQUEST_TYPE,
  ASSET_REQUEST_STEP_KEYS,
} = require("../constants/assetRequest");

const createAssetRequestSchema = Joi.object({
  requestType: Joi.string().valid(...Object.values(ASSET_REQUEST_TYPE)).required(),
  merchantId: Joi.string().hex().length(24).allow(null).optional(),
  productId: Joi.string().hex().length(24).required(),
  requestedQuantity: Joi.number().integer().min(1).default(1),
  businessJustification: Joi.string().trim().required(),
  priority: Joi.string().valid(...Object.values(ASSET_REQUEST_PRIORITY)).optional(),
});

const approveRequestSchema = Joi.object({
  stepKey: Joi.string().valid(...Object.values(ASSET_REQUEST_STEP_KEYS)).required(),
  remarks: Joi.string().trim().allow("").optional(),
});

const fulfillRequestSchema = Joi.object({
  remarks: Joi.string().trim().allow("").optional(),
});

const rejectionSchema = Joi.object({
  stepKey: Joi.string().valid(...Object.values(ASSET_REQUEST_STEP_KEYS)).required(),
  rejectionReason: Joi.string().trim().required(),
  remarks: Joi.string().trim().allow("").optional(),
});

const forwardSchema = Joi.object({
  targetSpaceId: Joi.string().hex().length(24).required(),
});

const getAssetRequestsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  employeeId: Joi.string().hex().length(24).optional(),
  merchantId: Joi.string().hex().length(24).optional(),
  productId: Joi.string().hex().length(24).optional(),
  requestType: Joi.string().valid(...Object.values(ASSET_REQUEST_TYPE)).optional(),
  status: Joi.string().optional(),
  priority: Joi.string().optional(),
  spaceId: Joi.string().hex().length(24).optional(),
});

module.exports = {
  createAssetRequestSchema,
  approveRequestSchema,
  fulfillRequestSchema,
  rejectionSchema,
  forwardSchema,
  getAssetRequestsSchema,
};
