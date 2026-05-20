const Product = require("../models/product.model");

const createProduct = async (payload) => Product.create(payload);

const findProductBySku = async (spaceId, sku) => Product.findOne({ spaceId, sku, isDeleted: false }).lean();

const findProductById = async (id) => Product.findOne({ _id: id, isDeleted: false }).lean();

const getProducts = async ({ spaceId, page, limit }) => {
  const skip = (page - 1) * limit;

  const query = { spaceId, isDeleted: false };

  const [products, total] = await Promise.all([
    Product.find(query).select("-__v").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateProduct = async (id, updateData) => Product.findByIdAndUpdate(id, updateData, { new: true }).lean();

const softDeleteProduct = async (id, deletedBy) => Product.findByIdAndUpdate(id, {
  isDeleted: true,
  deletedAt: new Date(),
  deletedBy,
}, { new: true }).lean();

module.exports = {
  createProduct,
  findProductBySku,
  findProductById,
  getProducts,
  updateProduct,
  softDeleteProduct,
};