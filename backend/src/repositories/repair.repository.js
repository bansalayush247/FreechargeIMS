const Repair = require("../models/repair.model");

const create = async (payload) => {
  return Repair.create(payload);
};

const findById = async (id) => {
  return Repair.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("inventoryItemId")
    .populate("productId", "name sku")
    .populate("warehouseId", "name code")
    .populate("reportedBy", "firstName lastName")
    .lean();
};

const findActiveByInventoryItemId = async (
  inventoryItemId,
  statuses
) => {
  return Repair.findOne({
    inventoryItemId,
    status: {
      $in: statuses,
    },
    isDeleted: false,
  }).lean();
};

const updateById = async (id, payload) => {
  return Repair.findOneAndUpdate(
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
    inventoryItemId,
    productId,
    warehouseId,
    assignedUserId,
    reportedBy,
    status,
    priority,
  } = filters;

  const skip = (page - 1) * limit;

  const query = {
    isDeleted: false,
  };

  if (inventoryItemId) {
    query.inventoryItemId = inventoryItemId;
  }

  if (spaceId) {
    query.spaceId = spaceId;
  }

  if (productId) {
    query.productId = productId;
  }

  if (warehouseId) {
    query.warehouseId = warehouseId;
  }

  if (assignedUserId) {
    query.assignedUserId = assignedUserId;
  }

  if (reportedBy) {
    query.reportedBy = reportedBy;
  }

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
  }

  const [items, total] = await Promise.all([
    Repair.find(query)
      .populate("inventoryItemId")
      .populate("productId", "name sku")
      .populate("warehouseId", "name code")
      .populate("reportedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Repair.countDocuments(query),
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
  findActiveByInventoryItemId,
  updateById,
  paginate,
};
