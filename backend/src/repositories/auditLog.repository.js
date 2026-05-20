const AuditLog = require("../models/auditLog.model");

const create = async (payload, session) => {
  if (session) {
    const [auditLog] = await AuditLog.create([payload], {
      session,
    });

    return auditLog;
  }

  return AuditLog.create(payload);
};

const findById = async (id) => {
  return AuditLog.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("actorId", "firstName lastName email")
    .lean();
};

const paginate = async (filters) => {
  const {
    page,
    limit,
    spaceId,
    actorId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
  } = filters;

  const skip = (page - 1) * limit;

  const query = {
    isDeleted: false,
  };

  if (spaceId) {
    query.spaceId = spaceId;
  }

  if (actorId) {
    query.actorId = actorId;
  }

  if (action) {
    query.action = action;
  }

  if (entityType) {
    query.entityType = entityType;
  }

  if (entityId) {
    query.entityId = entityId;
  }

  if (startDate || endDate) {
    query.createdAt = {};

    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const [items, total] = await Promise.all([
    AuditLog.find(query)
      .populate("actorId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    AuditLog.countDocuments(query),
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
  paginate,
};
