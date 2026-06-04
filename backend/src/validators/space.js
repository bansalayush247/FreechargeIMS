const Joi = require("joi");
const { SPACE_TYPES } = require("../constants/space");
const mongoId = Joi.string().hex().length(24);

const normalizeType = (value) => {
  if (value.type) {
    return value;
  }

  if (value.spaceType && Object.values(SPACE_TYPES).includes(value.spaceType)) {
    value.type = value.spaceType;
  } else if (value.code && Object.values(SPACE_TYPES).includes(value.code)) {
    value.type = value.code;
  } else if (value.spaceCode && Object.values(SPACE_TYPES).includes(value.spaceCode)) {
    value.type = value.spaceCode;
  }

  delete value.spaceType;
  delete value.spaceCode;

  return value;
};

const createSpaceSchema = Joi.object({
  name: Joi.string().trim().required(),
  type: Joi.string().valid(...Object.values(SPACE_TYPES)).optional(),
  spaceType: Joi.string().valid(...Object.values(SPACE_TYPES)).optional(),
  code: Joi.string().trim().uppercase().optional(),
  spaceCode: Joi.string().trim().uppercase().optional(),
  description: Joi.string().trim().allow("").optional(),
  employeeWorkflowDefinitionId: mongoId.allow(null).optional(),
  merchantWorkflowDefinitionId: mongoId.allow(null).optional(),
  isActive: Joi.boolean().optional(),
})
  .or("type", "spaceType")
  .custom(normalizeType);

const updateSpaceSchema = Joi.object({
  name: Joi.string().trim().optional(),
  type: Joi.string().valid(...Object.values(SPACE_TYPES)).optional(),
  spaceType: Joi.string().valid(...Object.values(SPACE_TYPES)).optional(),
  code: Joi.string().trim().uppercase().optional(),
  spaceCode: Joi.string().trim().uppercase().optional(),
  description: Joi.string().trim().allow("").optional(),
  employeeWorkflowDefinitionId: mongoId.allow(null).optional(),
  merchantWorkflowDefinitionId: mongoId.allow(null).optional(),
  isActive: Joi.boolean().optional(),
})
  .min(1)
  .custom(normalizeType);

const getSpacesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().allow("").optional(),
  isActive: Joi.boolean().optional(),
  type: Joi.string().valid(...Object.values(SPACE_TYPES)).optional(),
});

module.exports = {
  createSpaceSchema,
  updateSpaceSchema,
  getSpacesSchema,
};
