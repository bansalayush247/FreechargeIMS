const Merchant = require("../models/merchant");

const create = async (payload) => Merchant.create(payload);

const findById = async (id) => {
  return Merchant.findOne({ _id: id, isDeleted: false }).lean();
};

const findBySpaceAndCode = async (spaceId, merchantCode) => {
  return Merchant.findOne({
    spaceId,
    merchantCode: String(merchantCode).toUpperCase(),
    isDeleted: false,
  }).lean();
};

const updateById = async (id, payload) => {
  return Merchant.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { returnDocument: "after" }
  ).lean();
};

const paginate = async (filters) => {
  const { page, limit, spaceId, isActive, search } = filters;
  const skip = (page - 1) * limit;
  const query = { spaceId, isDeleted: false };

  if (typeof isActive === "boolean") {
    query.isActive = isActive;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { merchantCode: { $regex: search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Merchant.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Merchant.countDocuments(query),
  ]);

  return {
    items,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = {
  create,
  findById,
  findBySpaceAndCode,
  updateById,
  paginate,
};
