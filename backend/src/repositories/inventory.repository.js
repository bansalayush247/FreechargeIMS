const InventoryItem = require("../models/inventory.model");

const create = async (payload) => {
  return InventoryItem.create(payload);
};

const findById = async (id) => {
  return InventoryItem.findOne({
    _id: id,
    isDeleted: false,
  }).lean();
};

const findOne = async (filter) => {
  return InventoryItem.findOne(filter).lean();
};

const updateById = async (id, payload) => {
  return InventoryItem.findOneAndUpdate(
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

const paginate = async ({
  page,
  limit,
  status,
  warehouseId,
  productId,
  search,
}) => {
  const skip = (page - 1) * limit;

  const query = {
    isDeleted: false,
  };

  if (status) {
    query.status = status;
  }

  if (warehouseId) {
    query.warehouseId = warehouseId;
  }

  if (productId) {
    query.productId = productId;
  }

  if (search) {
    query.$or = [
      {
        serialNumber: {
          $regex: search,
          $options: "i",
        },
      },
      {
        assetTag: {
          $regex: search,
          $options: "i",
        },
      },
      {
        qrCode: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const [items, total] = await Promise.all([
    InventoryItem.find(query)
      .populate("productId", "name sku")
      .populate("warehouseId", "name code")
      .populate("assignedUserId", "firstName lastName employeeId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    InventoryItem.countDocuments(query),
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
  findOne,
  updateById,
  paginate,
};