const Joi = require("joi");

const mongoId = Joi.string().hex().length(24);

const createJoinRequestSchema = Joi.object({
  message: Joi.string().trim().allow("").optional(),
});

const reviewJoinRequestSchema = Joi.object({
  action: Joi.string().valid("APPROVE", "REJECT").required(),
  remarks: Joi.string().trim().allow("").optional(),
});

const getJoinRequestsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  spaceId: mongoId.optional(),
  userId: mongoId.optional(),
  status: Joi.string().optional(),
});

module.exports = {
  createJoinRequestSchema,
  reviewJoinRequestSchema,
  getJoinRequestsSchema,
};
