const Joi = require("joi");

const {
  WORKFLOW_ENTITY_TYPES,
  WORKFLOW_STATUS,
  WORKFLOW_ACTIONS,
} = require("../constants/workflow");

const mongoId = Joi.string().hex().length(24);

const workflowStepSchema = Joi.object({
  stepKey: Joi.string().trim().required(),

  name: Joi.string().trim().required(),

  description: Joi.string().trim().allow("").optional(),

  order: Joi.number().integer().min(1).required(),

  allowedActions: Joi.array()
    .items(Joi.string().valid(...Object.values(WORKFLOW_ACTIONS)))
    .min(1)
    .required(),

  approverRoleIds: Joi.array().items(mongoId).default([]),

  nextStepKey: Joi.string().trim().allow("").optional(),

  metadata: Joi.object().optional(),
});

const createWorkflowDefinitionSchema = Joi.object({
  name: Joi.string().trim().required(),

  code: Joi.string().trim().uppercase().required(),

  entityType: Joi.string()
    .valid(...Object.values(WORKFLOW_ENTITY_TYPES))
    .required(),

  description: Joi.string().trim().allow("").optional(),

  steps: Joi.array().items(workflowStepSchema).min(1).required(),

  isActive: Joi.boolean().optional(),

  metadata: Joi.object().optional(),
});

const updateWorkflowDefinitionSchema = Joi.object({
  name: Joi.string().trim().optional(),

  description: Joi.string().trim().allow("").optional(),

  steps: Joi.array().items(workflowStepSchema).min(1).optional(),

  isActive: Joi.boolean().optional(),

  metadata: Joi.object().optional(),
}).min(1);

const getWorkflowDefinitionsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  entityType: Joi.string()
    .valid(...Object.values(WORKFLOW_ENTITY_TYPES))
    .optional(),

  isActive: Joi.boolean().optional(),

  search: Joi.string().trim().allow("").optional(),
});

const startWorkflowSchema = Joi.object({
  workflowDefinitionId: mongoId.required(),

  entityType: Joi.string()
    .valid(...Object.values(WORKFLOW_ENTITY_TYPES))
    .required(),

  entityId: mongoId.required(),

  metadata: Joi.object().optional(),
});

const transitionWorkflowSchema = Joi.object({
  action: Joi.string()
    .valid(...Object.values(WORKFLOW_ACTIONS))
    .required(),

  nextStepKey: Joi.string().trim().allow("").optional(),

  remarks: Joi.string().trim().allow("").optional(),

  metadata: Joi.object().optional(),
});

const getWorkflowInstancesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  entityType: Joi.string()
    .valid(...Object.values(WORKFLOW_ENTITY_TYPES))
    .optional(),

  entityId: mongoId.optional(),

  status: Joi.string()
    .valid(...Object.values(WORKFLOW_STATUS))
    .optional(),
});

module.exports = {
  createWorkflowDefinitionSchema,
  updateWorkflowDefinitionSchema,
  getWorkflowDefinitionsSchema,
  startWorkflowSchema,
  transitionWorkflowSchema,
  getWorkflowInstancesSchema,
};