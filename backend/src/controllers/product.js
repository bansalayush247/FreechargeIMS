const productService = require("../services/product");

const asyncHandler = require("../utils/asyncHandler");

// Handles create product.
const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct({
    body: req.body,
    userId: req.user._id,
    context: {
      spaceId: req.spaceId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    },
  });

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

// Handles get products.
const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;

  const limit = Number(req.query.limit) || 10;

  const result = await productService.getProducts({ page, limit, spaceId: req.spaceId });

  return res.status(200).json({
    success: true,
    data: result,
  });
});

// Handles update product.
const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct({
    productId: req.params.id,
    body: req.body,
    userId: req.user._id,
    context: {
      spaceId: req.spaceId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    },
  });

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

// Handles delete product.
const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct({
    productId: req.params.id,
    userId: req.user._id,
    context: {
      spaceId: req.spaceId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    },
  });

  return res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};
