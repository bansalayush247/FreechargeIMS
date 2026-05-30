const UserRole = require("../models/userRole");

// Handles create.
const create = async (payload) => {
  return UserRole.create(payload);
};

// Handles find by id.
const findById = async (id) => {
  return UserRole.findOne({
    _id: id,
    isDeleted: {
      $ne: true,
    },
  })
    .populate("userId", "firstName lastName email employeeId")
    .populate("roleId", "name code permissions")
    .lean();
};

// Handles find user roles by user and space.
const findUserRolesByUserAndSpace = async (userId, spaceId) => {
  return UserRole.find({
    userId,
    spaceId,
    isDeleted: {
      $ne: true,
    },
  })
    .select("roleId")
    .lean();
};

// Handles find by user role and space.
const findByUserRoleAndSpace = async (
  userId,
  roleId,
  spaceId
) => {
  return UserRole.findOne({
    userId,
    roleId,
    spaceId,
    isDeleted: {
      $ne: true,
    },
  }).lean();
};

// Handles soft delete by id.
const softDeleteById = async (id, payload) => {
  return UserRole.findOneAndUpdate(
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

// Handles soft delete by user and space.
const softDeleteByUserAndSpace = async (
  userId,
  spaceId,
  payload
) => {
  return UserRole.updateMany(
    {
      userId,
      spaceId,
      isDeleted: {
        $ne: true,
      },
    },
    payload
  );
};

// Handles soft delete by role and space.
const softDeleteByRoleAndSpace = async (
  roleId,
  spaceId,
  payload
) => {
  return UserRole.updateMany(
    {
      roleId,
      spaceId,
      isDeleted: {
        $ne: true,
      },
    },
    payload
  );
};

// Handles paginate.
const paginate = async (filters) => {
  const { page, limit, spaceId, userId, roleId } = filters;

  const skip = (page - 1) * limit;

  const query = {
    spaceId,
    isDeleted: {
      $ne: true,
    },
  };

  if (userId) {
    query.userId = userId;
  }

  if (roleId) {
    query.roleId = roleId;
  }

  const [items, total] = await Promise.all([
    UserRole.find(query)
      .populate("userId", "firstName lastName email employeeId")
      .populate("roleId", "name code permissions")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    UserRole.countDocuments(query),
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
  findUserRolesByUserAndSpace,
  findByUserRoleAndSpace,
  softDeleteById,
  softDeleteByUserAndSpace,
  softDeleteByRoleAndSpace,
  paginate,
};


