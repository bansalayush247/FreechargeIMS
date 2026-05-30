const Space = require("../models/space");

// Handles create.
const create = async (payload) => {
  return Space.create(payload);
};

// Handles find by id.
const findById = async (id) => {
  return Space.findOne({
    _id: id,
    isDeleted: false,
  }).lean();
};

// Handles find by code.
const findByCode = async (code) => {
  return Space.findOne({
    code,
    isDeleted: false,
  }).lean();
};

// Handles find by type.
const findByType = async (type) => {
  return Space.findOne({
    type,
    isDeleted: false,
  }).lean();
};

// Handles find by name.
const findByName = async (name) => {
  return Space.findOne({
    name,
    isDeleted: false,
  }).lean();
};

// Handles update by id.
const updateById = async (id, payload) => {
  return Space.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
    },
    payload,
    {
      returnDocument: "after",
    }
  ).lean();
};

// Handles paginate.
const paginate = async (filters) => {
  const { page, limit, search, isActive, type } = filters;

  const skip = (page - 1) * limit;

  const query = {
    isDeleted: false,
  };

  if (typeof isActive === "boolean") {
    query.isActive = isActive;
  }

  if (type) {
    query.type = type;
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
      {
        type: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const [items, total] = await Promise.all([
    Space.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Space.countDocuments(query),
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
  findByType,
  findByName,
  updateById,
  paginate,
  findByIds,
};

// Handles find multiple by ids.
async function findByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  return Space.find({
    _id: { $in: ids },
    isDeleted: false,
  }).lean();
}


