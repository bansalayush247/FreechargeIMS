const productService = require("../services/product");

const asyncHandler = require("../utils/asyncHandler");

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct({
    body: req.body,
    userId: req.user._id,
    spaceId: req.spaceId,
    context: {
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

const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;

  const limit = Number(req.query.limit) || 10;

  const result = await productService.getProducts({
    spaceId: req.spaceId,
    page,
    limit,
  });

  return res.status(200).json({
    success: true,
    data: result,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct({
    productId: req.params.id,
    body: req.body,
    userId: req.user._id,
    context: {
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

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct({
    productId: req.params.id,
    userId: req.user._id,
    context: {
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
