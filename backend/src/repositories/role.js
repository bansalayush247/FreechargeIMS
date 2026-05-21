const Role = require("../models/role");

const create = async (payload) => {
  return Role.create(payload);
};

const findById = async (id) => {
  return Role.findOne({
    _id: id,
    isDeleted: false,
  }).lean();
};

const findBySpaceAndCode = async (spaceId, code) => {
  return Role.findOne({
    spaceId,
    code,
    isDeleted: false,
  }).lean();
};

const findActiveRolesByIds = async (roleIds) => {
  return Role.find({
    _id: {
      $in: roleIds,
    },
    isDeleted: false,
    isActive: true,
  })
    .select("permissions")
    .lean();
};

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


