const Space = require("../models/space");

const create = async (payload) => {
  return Space.create(payload);
};

const findById = async (id) => {
  return Space.findOne({
    _id: id,
    isDeleted: false,
  }).lean();
};

const findByCode = async (code) => {
  return Space.findOne({
    code,
    isDeleted: false,
  }).lean();
};

const findByName = async (name) => {
  return Space.findOne({
    name,
    isDeleted: false,
  }).lean();
};

const updateById = async (id, payload) => {
  return Space.findOneAndUpdate(
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
  const { page, limit, search, isActive } = filters;

  const skip = (page - 1) * limit;

  const query = {
    isDeleted: false,
  };

  if (typeof isActive === "boolean") {
    query.isActive = isActive;
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
  findByName,
  updateById,
  paginate,
};


