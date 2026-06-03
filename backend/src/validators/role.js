const Joi = require("joi");

const {
  PERMISSIONS,
  PERMISSION_REGISTRY,
} = require("../constants/permission");

const createRoleSchema = Joi.object({
  name: Joi.string().trim().required(),

  code: Joi.string().trim().uppercase().required(),

  description: Joi.string().trim().allow("").optional(),

  permissions: Joi.array()
    .items(
      Joi.string().valid(...Object.values(PERMISSION_REGISTRY))
    )
    .default([]),

  isActive: Joi.boolean().optional(),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().trim().optional(),

  description: Joi.string().trim().allow("").optional(),

  permissions: Joi.array()
    .items(
      Joi.string().valid(...Object.values(PERMISSION_REGISTRY))
    )
    .optional(),

  isActive: Joi.boolean().optional(),
}).min(1);

const getRolesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  search: Joi.string().trim().allow("").optional(),

  isActive: Joi.boolean().optional(),

  isSystemRole: Joi.boolean().optional(),
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  getRolesSchema,
};


