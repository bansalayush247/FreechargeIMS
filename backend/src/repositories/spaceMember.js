const SpaceMember = require("../models/spaceMember");

// Handles create.
const create = async (payload) => {
  return SpaceMember.create(payload);
};

// Handles find by id.
const findById = async (id) => {
  return SpaceMember.findOne({
    _id: id,
    isDeleted: {
      $ne: true,
    },
  })
    .populate("userId", "firstName lastName email employeeId")
    .lean();
};

// Handles find by user and space.
const findByUserAndSpace = async (userId, spaceId) => {
  return SpaceMember.findOne({
    userId,
    spaceId,
    isDeleted: {
      $ne: true,
    },
  }).lean();
};

// Handles update by id.
const updateById = async (id, payload) => {
  return SpaceMember.findOneAndUpdate(
    {
      _id: id,
      isDeleted: {
        $ne: true,
      },
    },
    payload,
    {
      returnDocument: "after",
    }
  ).lean();
};

// Handles paginate.
const paginate = async (filters) => {
  const { page, limit, spaceId, userId, isActive } =
    filters;

  const skip = (page - 1) * limit;

  const query = {
    isDeleted: {
      $ne: true,
    },
  };

  if (spaceId) {
    query.spaceId = spaceId;
  }

  if (userId) {
    query.userId = userId;
  }

  if (typeof isActive === "boolean") {
    query.isActive = isActive;
  }

  const [items, total] = await Promise.all([
    SpaceMember.find(query)
      .populate("userId", "firstName lastName email employeeId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    SpaceMember.countDocuments(query),
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
  findByUserAndSpace,
  updateById,
  paginate,
};


