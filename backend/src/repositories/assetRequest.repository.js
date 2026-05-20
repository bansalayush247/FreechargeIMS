const AssetRequest = require("../models/assetRequest.model");

const create = async (payload) => {
  return AssetRequest.create(payload);
};

const findById = async (id) => {
  return AssetRequest.findOne({
    _id: id,
    isDeleted: false,
  }).lean();
};

const updateById = async (id, payload) => {
  return AssetRequest.findOneAndUpdate(
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
    employeeId,
    productId,
    status,
    priority,
  } = filters;

  const skip = (page - 1) * limit;

  const query = {
    isDeleted: false,
  };

  if (employeeId) {
    query.employeeId = employeeId;
  }

  if (productId) {
    query.productId = productId;
  }

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
  }

  const [items, total] = await Promise.all([
    AssetRequest.find(query)
      .populate("employeeId", "firstName lastName")
      .populate("productId", "name sku")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    AssetRequest.countDocuments(query),
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
  paginate,
};