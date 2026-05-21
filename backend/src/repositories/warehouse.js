const Warehouse = require("../models/warehouse");

const createWarehouse = async (payload) => {
  return Warehouse.create(payload);
};

const findWarehouseByCode = async (
  spaceId,
  code
) => {
  return Warehouse.findOne({
    spaceId,
    code,
    isDeleted: false,
  }).lean();
};

const findWarehouseById = async (id) => {
  return Warehouse.findOne({
    _id: id,
    isDeleted: false,
  }).lean();
};

const getWarehouses = async ({
  spaceId,
  page,
  limit,
}) => {
  const skip = (page - 1) * limit;

  const query = {
    spaceId,
    isDeleted: false,
  };

  const [warehouses, total] =
    await Promise.all([
      Warehouse.find(query)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Warehouse.countDocuments(query),
    ]);

  return {
    warehouses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateWarehouse = async (
  id,
  updateData
) => {
  return Warehouse.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
    }
  ).lean();
};

const softDeleteWarehouse = async (
  id,
  deletedBy
) => {
  return Warehouse.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy,
    },
    {
      new: true,
    }
  ).lean();
};

module.exports = {
  createWarehouse,
  findWarehouseByCode,
  findWarehouseById,
  getWarehouses,
  updateWarehouse,
  softDeleteWarehouse,
};

