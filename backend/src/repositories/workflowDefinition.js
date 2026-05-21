const WorkflowDefinition = require("../models/workflowDefinition");

// Handles create workflow definition.
const create = async (payload) => {
  return WorkflowDefinition.create(payload);
};

// Handles find workflow definition by id.
const findById = async (id) => {
  return WorkflowDefinition.findOne({
    _id: id,
    isDeleted: false,
  }).lean();
};

// Handles find workflow definition by code.
const findByCode = async (spaceId, code) => {
  return WorkflowDefinition.findOne({
    spaceId,
    code,
    isDeleted: false,
  }).lean();
};

// Handles update workflow definition by id.
const updateById = async (id, payload) => {
  return WorkflowDefinition.findOneAndUpdate(
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

// Handles paginate workflow definitions.
const paginate = async (filters) => {
  const { page, limit, spaceId, entityType, isActive, search } =
    filters;

  const skip = (page - 1) * limit;

  const query = {
    spaceId,
    isDeleted: false,
  };

  if (entityType) {
    query.entityType = entityType;
  }

  if (typeof isActive === "boolean") {
    query.isActive = isActive;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    WorkflowDefinition.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WorkflowDefinition.countDocuments(query),
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
  findByCode,
  updateById,
  paginate,
};