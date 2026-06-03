const InventoryStock = require("../models/inventoryStock");
const { resolveInventoryStockAlertStatus } = require("../constants/inventory");

const create = async (payload, options = {}) => {
  if (options.session) {
    const [created] = await InventoryStock.create([payload], { session: options.session });
    return created;
  }

  return InventoryStock.create(payload);
};

const findByProductId = async (productId, options = {}) => {
  const filter = { productId, isDeleted: false };

  if (options.spaceId) {
    filter.spaceId = options.spaceId;
  }

  const query = InventoryStock.findOne(filter);
  if (options.session) query.session(options.session);
  return options.lean === false ? query : query.lean();
};

const updateByProductId = async (productId, payload, options = {}) => {
  const filter = { productId, isDeleted: false };

  if (options.spaceId) {
    filter.spaceId = options.spaceId;
  }

  return InventoryStock.findOneAndUpdate(
    filter,
    payload,
    {
      returnDocument: "after",
      session: options.session,
    }
  ).lean();
};

const paginate = async ({ page, limit, productId, search, spaceId }) => {
  const skip = (page - 1) * limit;
  const query = { isDeleted: false };

  if (spaceId) {
    query.spaceId = spaceId;
  }

  if (productId) {
    query.productId = productId;
  }

  const stockQuery = InventoryStock.find(query)
    .populate("productId", "name sku category trackingType imageUrl")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const [items, total] = await Promise.all([
    stockQuery,
    InventoryStock.countDocuments(query),
  ]);

  const filteredItems = search
    ? items.filter((item) => {
        const product = item.productId || {};
        const haystack = `${product.name || ""} ${product.sku || ""}`.toLowerCase();
        return haystack.includes(String(search).toLowerCase());
      })
    : items;

  return {
    items: filteredItems.map((item) => ({
      ...item,
      alertStatus: resolveInventoryStockAlertStatus(item),
    })),
    pagination: {
      total: search ? filteredItems.length : total,
      page,
      limit,
      totalPages: Math.ceil((search ? filteredItems.length : total) / limit),
    },
  };
};

const findLowStock = async ({ page, limit, spaceId }) => {
  const skip = (page - 1) * limit;
  const query = {
    isDeleted: false,
    spaceId,
    availableQuantity: { $gt: 0 },
    $expr: { $lte: ["$availableQuantity", "$reorderLevel"] },
  };

  const [items, total] = await Promise.all([
    InventoryStock.find(query)
      .populate("productId", "name sku category trackingType imageUrl")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InventoryStock.countDocuments(query),
  ]);

  return {
    items: items.map((item) => ({ ...item, alertStatus: resolveInventoryStockAlertStatus(item) })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const findOutOfStock = async ({ page, limit, spaceId }) => {
  const skip = (page - 1) * limit;
  const query = {
    isDeleted: false,
    spaceId,
    availableQuantity: { $lte: 0 },
  };

  const [items, total] = await Promise.all([
    InventoryStock.find(query)
      .populate("productId", "name sku category trackingType imageUrl")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InventoryStock.countDocuments(query),
  ]);

  return {
    items: items.map((item) => ({ ...item, alertStatus: resolveInventoryStockAlertStatus(item) })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const findProcurementRequired = async ({ page, limit, spaceId }) => {
  const skip = (page - 1) * limit;
  const query = {
    isDeleted: false,
    spaceId,
    availableQuantity: { $gt: 0 },
    reorderQuantity: { $gt: 0 },
    $expr: { $lte: ["$availableQuantity", "$reorderQuantity"] },
  };

  const [items, total] = await Promise.all([
    InventoryStock.find(query)
      .populate("productId", "name sku category trackingType imageUrl")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InventoryStock.countDocuments(query),
  ]);

  return {
    items: items.map((item) => ({ ...item, alertStatus: resolveInventoryStockAlertStatus(item) })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = {
  create,
  findByProductId,
  updateByProductId,
  paginate,
  findLowStock,
  findOutOfStock,
  findProcurementRequired,
};
