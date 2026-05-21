const WorkflowInstance = require("../models/workflowInstance");

// Handles create workflow instance.
const create = async (payload) => {
  return WorkflowInstance.create(payload);
};

// Handles find workflow instance by id.
const findById = async (id) => {
  return WorkflowInstance.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("workflowDefinitionId", "name code entityType steps")
    .lean();
};

// Handles update workflow instance by id.
const updateById = async (id, payload) => {
  return WorkflowInstance.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
    },
    payload,
    {
      new: true,
    }
  ).lean();
};

// Handles find active workflow instance for entity.
const findActiveByEntity = async (spaceId, entityType, entityId) => {
  return WorkflowInstance.findOne({
    spaceId,
    entityType,
    entityId,
    status: "ACTIVE",
    isDeleted: false,
  }).lean();
};

// Handles paginate workflow instances.
const paginate = async (filters) => {
  const { page, limit, spaceId, entityType, entityId, status } =
    filters;

  const skip = (page - 1) * limit;

  const query = {
    spaceId,
    isDeleted: false,
  };

  if (entityType) {
    query.entityType = entityType;
  }

  if (entityId) {
    query.entityId = entityId;
  }

  if (status) {
    query.status = status;
  }

  const [items, total] = await Promise.all([
    WorkflowInstance.find(query)
      .populate("workflowDefinitionId", "name code entityType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WorkflowInstance.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  create,
  findById,
  updateById,
  findActiveByEntity,
  paginate,
};