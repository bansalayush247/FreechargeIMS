const InventoryTransaction = require("../models/inventoryTransaction");
const {
  getInventoryTransactionTypeQueryValues,
} = require("../constants/inventoryTransaction");

// Handles create.
const create = async (payload, session) => {
  const [transaction] = await InventoryTransaction.create([payload], {
    session,
  });

  return transaction;
};

// Handles find by id.
const findById = async (id, spaceId) => {
  return InventoryTransaction.findOne({
    _id: id,
    spaceId,
    isDeleted: false,
  })
    .populate("inventoryItemId")
    .populate("productId", "name sku")
    .populate("performedBy", "firstName lastName email employeeId")
    .populate("fromWarehouseId", "name code")
    .populate("toWarehouseId", "name code")
    .populate("fromUserId", "firstName lastName email employeeId")
    .populate("toUserId", "firstName lastName email employeeId")
    .lean();
};

// Handles paginate.
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
    spaceId,
  } = filters;

  const skip = (page - 1) * limit;

  const query = {
    isDeleted: false,
    spaceId,
  };

  if (inventoryItemId) {
    query.inventoryItemId = inventoryItemId;
  }

  if (transactionType) {
    query.transactionType = {
      $in: getInventoryTransactionTypeQueryValues(transactionType),
    };
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
      .populate("performedBy", "firstName lastName email employeeId")
      .populate("fromWarehouseId", "name code")
      .populate("toWarehouseId", "name code")
      .populate("fromUserId", "firstName lastName email employeeId")
      .populate("toUserId", "firstName lastName email employeeId")
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

// Handles get item audit trail.
const getItemAuditTrail = async (inventoryItemId, spaceId) => {
  return InventoryTransaction.find({
    inventoryItemId,
    spaceId,
    isDeleted: false,
  })
    .populate("performedBy", "firstName lastName email employeeId")
    .populate("fromWarehouseId", "name code")
    .populate("toWarehouseId", "name code")
    .populate("fromUserId", "firstName lastName email employeeId")
    .populate("toUserId", "firstName lastName email employeeId")
    .sort({ transactionDate: 1 })
    .lean();
};

module.exports = {
  create,
  findById,
  paginate,
  getItemAuditTrail,
};
