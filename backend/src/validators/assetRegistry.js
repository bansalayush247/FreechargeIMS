const Joi = require("joi");

const { ASSET_REGISTRY_STATUS } = require("../models/assetRegistry");

const getAssetRegistrySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  assignedToUserId: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid(...Object.values(ASSET_REGISTRY_STATUS)).optional(),
});

module.exports = {
  getAssetRegistrySchema,
};
