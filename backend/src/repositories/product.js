const Product = require("../models/product");

// Handles create product.
const createProduct = async (payload) => Product.create(payload);

// Handles find product by sku.
const findProductBySku = async (spaceId, sku) => Product.findOne({ spaceId, sku, isDeleted: false }).lean();

// Handles find product by id.
const findProductById = async (id) => Product.findOne({ _id: id, isDeleted: false }).lean();

// Handles get products.
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

// Handles update product.
const updateProduct = async (id, updateData) => Product.findByIdAndUpdate(id, updateData, { new: true }).lean();

// Handles soft delete product.
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

