const Joi = require("joi");

const mongoId = Joi.string().hex().length(24);

const addSpaceMemberSchema = Joi.object({
  userId: mongoId.required(),
});

const updateSpaceMemberSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

const assignUserRoleSchema = Joi.object({
  userId: mongoId.required(),

  roleId: mongoId.required(),
});

const getSpaceMembersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  userId: mongoId.optional(),

  isActive: Joi.boolean().optional(),
});

const getUserRolesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  userId: mongoId.optional(),

  roleId: mongoId.optional(),
});

module.exports = {
  addSpaceMemberSchema,
  updateSpaceMemberSchema,
  assignUserRoleSchema,
  getSpaceMembersSchema,
  getUserRolesSchema,
};
