const InventoryTransaction = require("../models/inventoryTransaction");

const create = async (payload, session) => {
  const [transaction] = await InventoryTransaction.create([payload], {
    session,
  });

  return transaction;
};

const findById = async (id) => {
  return InventoryTransaction.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("inventoryItemId")
    .populate("productId", "name sku")
    .populate("performedBy", "firstName lastName")
    .lean();
};

const paginate = async (filters) => {
  const {
    page,
    limit,
    inventoryItemId,
    transactionType,
    performedBy,
    warehouseId,
    startDate,
    endDate,
  } = filters;

  const skip = (page - 1) * limit;

  const query = {
    isDeleted: false,
  };

  if (inventoryItemId) {
    query.inventoryItemId = inventoryItemId;
  }

  if (transactionType) {
    query.transactionType = transactionType;
  }

  if (performedBy) {
    query.performedBy = performedBy;
  }

  if (warehouseId) {
    query.$or = [
      { fromWarehouseId: warehouseId },
      { toWarehouseId: warehouseId },
    ];
  }

  if (startDate || endDate) {
    query.transactionDate = {};

    if (startDate) {
      query.transactionDate.$gte = new Date(startDate);
    }

    if (endDate) {
      query.transactionDate.$lte = new Date(endDate);
    }
  }

  const [items, total] = await Promise.all([
    InventoryTransaction.find(query)
      .populate("inventoryItemId")
      .populate("productId", "name sku")
      .populate("performedBy", "firstName lastName")
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    InventoryTransaction.countDocuments(query),
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

const getItemAuditTrail = async (inventoryItemId) => {
  return InventoryTransaction.find({
    inventoryItemId,
    isDeleted: false,
  })
    .populate("performedBy", "firstName lastName")
    .sort({ transactionDate: 1 })
    .lean();
};

module.exports = {
  create,
  findById,
  paginate,
  getItemAuditTrail,
};

