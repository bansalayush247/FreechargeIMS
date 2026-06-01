const Joi = require("joi");

const createMerchantSchema = Joi.object({
  merchantCode: Joi.string().trim().uppercase().required(),
  name: Joi.string().trim().required(),
  contactName: Joi.string().trim().allow("").optional(),
  contactPhone: Joi.string().trim().allow("").optional(),
  contactEmail: Joi.string().trim().email().allow("").optional(),
  address: Joi.string().trim().allow("").optional(),
  isActive: Joi.boolean().optional(),
});

const updateMerchantSchema = Joi.object({
  merchantCode: Joi.string().trim().uppercase().optional(),
  name: Joi.string().trim().optional(),
  contactName: Joi.string().trim().allow("").optional(),
  contactPhone: Joi.string().trim().allow("").optional(),
  contactEmail: Joi.string().trim().email().allow("").optional(),
  address: Joi.string().trim().allow("").optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createMerchantSchema,
  updateMerchantSchema,
};
