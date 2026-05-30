const AssetRequest = require("../models/assetRequest");

// Handles create.
const create = async (payload) => {
  return AssetRequest.create(payload);
};

// Handles find by id.
const findById = async (id) => {
  return AssetRequest.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("spaceId", "name code")
    .populate("originSpaceId", "name code")
    .populate("employeeId", "firstName lastName email employeeId")
    .populate("productId", "name sku")
    .populate("inventoryItemId", "_id")
    .populate("managerApprovalBy", "firstName lastName email")
    .populate("itApprovalBy", "firstName lastName email")
    .populate("forwardedBy", "firstName lastName email")
    .populate("forwardedFromSpaceId", "name code")
    .populate("forwardedHistory.fromSpaceId", "name code")
    .populate("forwardedHistory.toSpaceId", "name code")
    .populate("forwardedHistory.forwardedBy", "firstName lastName email")
    .lean();
};

// Handles update by id.
const updateById = async (id, payload) => {
  return AssetRequest.findOneAndUpdate(
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
  const {
    page,
    limit,
    employeeId,
    productId,
    status,
    priority,
    spaceId,
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

  if (spaceId) {
    query.spaceId = spaceId;
  }

  const [items, total] = await Promise.all([
    AssetRequest.find(query)
      .populate("spaceId", "name code")
      .populate("originSpaceId", "name code")
      .populate("employeeId", "firstName lastName")
      .populate("productId", "name sku")
      .populate("inventoryItemId", "_id")
      .populate("managerApprovalBy", "firstName lastName email")
      .populate("itApprovalBy", "firstName lastName email")
      .populate("forwardedBy", "firstName lastName email")
      .populate("forwardedFromSpaceId", "name code")
      .populate("forwardedHistory.fromSpaceId", "name code")
      .populate("forwardedHistory.toSpaceId", "name code")
      .populate("forwardedHistory.forwardedBy", "firstName lastName email")
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

