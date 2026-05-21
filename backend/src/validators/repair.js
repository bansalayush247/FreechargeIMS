const Joi = require("joi");

const {
  REPAIR_STATUS,
  REPAIR_PRIORITY,
  REPAIR_OUTCOME,
} = require("../constants/repair");

const mongoId = Joi.string().hex().length(24);

const createRepairSchema = Joi.object({
  inventoryItemId: mongoId.required(),

  issueDescription: Joi.string().trim().required(),

  priority: Joi.string()
    .valid(...Object.values(REPAIR_PRIORITY))
    .optional(),

  vendorName: Joi.string().trim().allow("").optional(),

  expectedReturnAt: Joi.date().allow(null).optional(),

  metadata: Joi.object().optional(),
});

const updateRepairSchema = Joi.object({
  status: Joi.string()
    .valid(REPAIR_STATUS.IN_PROGRESS)
    .optional(),

  vendorName: Joi.string().trim().allow("").optional(),

  expectedReturnAt: Joi.date().allow(null).optional(),

  resolutionNotes: Joi.string().trim().allow("").optional(),

  metadata: Joi.object().optional(),
}).min(1);

const completeRepairSchema = Joi.object({
  outcome: Joi.string()
    .valid(...Object.values(REPAIR_OUTCOME))
    .required(),

  resolutionNotes: Joi.string().trim().required(),

  metadata: Joi.object().optional(),
});

const cancelRepairSchema = Joi.object({
  resolutionNotes: Joi.string().trim().allow("").optional(),
});

const getRepairsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  spaceId: mongoId.optional(),

  inventoryItemId: mongoId.optional(),

  productId: mongoId.optional(),

  warehouseId: mongoId.optional(),

  assignedUserId: mongoId.optional(),

  reportedBy: mongoId.optional(),

  status: Joi.string()
    .valid(...Object.values(REPAIR_STATUS))
    .optional(),

  priority: Joi.string()
    .valid(...Object.values(REPAIR_PRIORITY))
    .optional(),
});

module.exports = {
  createRepairSchema,
  updateRepairSchema,
  completeRepairSchema,
  cancelRepairSchema,
  getRepairsSchema,
};


