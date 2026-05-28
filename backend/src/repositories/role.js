const Role = require("../models/role");

// Handles create.
const create = async (payload) => {
  return Role.create(payload);
};

// Handles find by id.
const findById = async (id) => {
  return Role.findOne({
    _id: id,
    isDeleted: false,
  }).lean();
};

// Handles find by space and code.
const findBySpaceAndCode = async (spaceId, code) => {
  return Role.findOne({
    spaceId,
    code,
    isDeleted: false,
  }).lean();
};

// Handles find active roles by ids.
const findActiveRolesByIds = async (roleIds) => {
  const uniqueRoleIds = [...new Set(roleIds.map(String))];

  if (!uniqueRoleIds.length) {
    return [];
  }

  return Role.find({
    _id: {
      $in: uniqueRoleIds,
    },
    isDeleted: false,
    isActive: true,
  })
    .select("permissions code")
    .lean();
};

// Handles update by id.
const updateById = async (id, payload) => {
  return Role.findOneAndUpdate(
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

// Handles paginate.
const paginate = async (filters) => {
  const {
    page,
    limit,
    spaceId,
    search,
    isActive,
    isSystemRole,
  } = filters;

  const skip = (page - 1) * limit;

  const query = {
    spaceId,
    isDeleted: false,
  };

  if (typeof isActive === "boolean") {
    query.isActive = isActive;
  }

  if (typeof isSystemRole === "boolean") {
    query.isSystemRole = isSystemRole;
  }

  if (search) {
    query.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        code: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const [items, total] = await Promise.all([
    Role.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Role.countDocuments(query),
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
  findBySpaceAndCode,
  findActiveRolesByIds,
  updateById,
  paginate,
};


