const Joi = require("joi");

const createSpaceSchema = Joi.object({
  name: Joi.string().trim().required(),

  code: Joi.string().trim().uppercase().optional(),

  spaceCode: Joi.string().trim().uppercase().optional(),

  description: Joi.string().trim().allow("").optional(),

  isActive: Joi.boolean().optional(),
})
  .or("code", "spaceCode")
  .custom((value, helpers) => {
    if (!value.code && value.spaceCode) {
      value.code = value.spaceCode;
    }

    delete value.spaceCode;

    return value;
  });

const updateSpaceSchema = Joi.object({
  name: Joi.string().trim().optional(),

  code: Joi.string().trim().uppercase().optional(),

  spaceCode: Joi.string().trim().uppercase().optional(),

  description: Joi.string().trim().allow("").optional(),

  isActive: Joi.boolean().optional(),
})
  .min(1)
  .custom((value, helpers) => {
    if (!value.code && value.spaceCode) {
      value.code = value.spaceCode;
    }

    delete value.spaceCode;

    return value;
  });

const getSpacesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  search: Joi.string().trim().allow("").optional(),

  isActive: Joi.boolean().optional(),
});

module.exports = {
  createSpaceSchema,
  updateSpaceSchema,
  getSpacesSchema,
};
