const { AssetRegistry, ASSET_REGISTRY_STATUS } = require("../models/assetRegistry");

const create = async (payload, session = null) => {
  const [created] = await AssetRegistry.create([payload], session ? { session } : {});
  return created;
};

const findActiveByInventoryItemAndAssignee = async ({
  sourceInventoryItemId,
  assignedToUserId = null,
  assignedToMerchantId = null,
}, session = null) => {
  const query = {
    sourceInventoryItemId,
    status: ASSET_REGISTRY_STATUS.ASSIGNED,
    isDeleted: false,
  };

  if (assignedToUserId) {
    query.assignedToUserId = assignedToUserId;
  }

  if (assignedToMerchantId) {
    query.assignedToMerchantId = assignedToMerchantId;
  }

  const docQuery = AssetRegistry.findOne(query);
  if (session) docQuery.session(session);
  return docQuery;
};

const paginateBySpace = async ({ page, limit, assignedSpaceId, assignedToUserId, status }) => {
  const skip = (page - 1) * limit;
  const query = {
    assignedSpaceId,
    isDeleted: false,
  };

  if (assignedToUserId) {
    query.assignedToUserId = assignedToUserId;
  }

  if (status) {
    query.status = status;
  }

  const [items, total] = await Promise.all([
    AssetRegistry.find(query)
      .populate("productId", "name sku category trackingType imageUrl")
      .populate("assignedToUserId", "firstName lastName email employeeId")
      .populate("assignedToMerchantId", "name merchantCode")
      .populate("assignedByUserId", "firstName lastName email employeeId")
      .populate("requestId", "requestNumber status requestedQuantity")
      .populate("sourceInventoryItemId", "assetTag serialNumber status")
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AssetRegistry.countDocuments(query),
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
  findActiveByInventoryItemAndAssignee,
  paginateBySpace,
  ASSET_REGISTRY_STATUS,
};
