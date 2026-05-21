const Joi = require("joi");

const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");

const mongoId = Joi.string().hex().length(24);

const getAuditLogsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  spaceId: mongoId.optional(),

  actorId: mongoId.optional(),

  action: Joi.string()
    .valid(...Object.values(AUDIT_ACTIONS))
    .optional(),

  entityType: Joi.string()
    .valid(...Object.values(AUDIT_ENTITY_TYPES))
    .optional(),

  entityId: mongoId.optional(),

  startDate: Joi.date().optional(),

  endDate: Joi.date().optional(),
});

module.exports = {
  getAuditLogsSchema,
};


