const AssetRequest = require("../models/assetRequest");

const create = async (payload) => AssetRequest.create(payload);

const findById = async (id, spaceId) => {
  return AssetRequest.findOne({ _id: id, spaceId, isDeleted: false })
    .populate("spaceId", "name code")
    .populate("employeeId", "firstName lastName email employeeId")
    .populate("merchantId", "name merchantCode")
    .populate("productId", "name sku trackingType assetType")
    .populate("inventoryItemId", "_id serialNumber assetTag")
    .lean();
};

const updateById = async (id, spaceId, payload) => {
  return AssetRequest.findOneAndUpdate(
    { _id: id, spaceId, isDeleted: false },
    payload,
    { returnDocument: "after" }
  ).lean();
};

const paginate = async (filters) => {
  const { page, limit, employeeId, merchantId, productId, status, priority, requestType, spaceId } = filters;
  const skip = (page - 1) * limit;
  const query = { isDeleted: false };

  if (employeeId) query.employeeId = employeeId;
  if (merchantId) query.merchantId = merchantId;
  if (productId) query.productId = productId;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (requestType) query.requestType = requestType;
  if (spaceId) query.spaceId = spaceId;

  const [items, total] = await Promise.all([
    AssetRequest.find(query)
      .populate("spaceId", "name code")
      .populate("employeeId", "firstName lastName")
      .populate("merchantId", "name merchantCode")
      .populate("productId", "name sku")
      .populate("inventoryItemId", "_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AssetRequest.countDocuments(query),
  ]);

  return {
    items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const fulfillmentQueue = async ({ page, limit, spaceId }) => {
  const skip = (page - 1) * limit;
  const query = {
    isDeleted: false,
    spaceId,
    status: { $in: ["PENDING_FULFILLMENT", "FULFILLMENT_PENDING", "FULFILLMENT_DELAYED"] },
  };

  const [items, total] = await Promise.all([
    AssetRequest.find(query)
      .populate("spaceId", "name code")
      .populate("employeeId", "firstName lastName")
      .populate("merchantId", "name merchantCode")
      .populate("productId", "name sku trackingType")
      .populate("inventoryItemId", "_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AssetRequest.countDocuments(query),
  ]);

  return {
    items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = { create, findById, updateById, paginate, fulfillmentQueue };
