const UserRole = require("../models/userRole");

const create = async (payload) => {
  return UserRole.create(payload);
};

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
      new: true,
    }
  ).lean();
};

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


