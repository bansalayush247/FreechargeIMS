const productRepository = require("../repositories/product");
const auditLogService = require("./auditLog");

const logger = require("../config/logger");

const AppError = require("../utils/appError");
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");

// Handles create product.
const createProduct = async ({
  body,
  userId,
  spaceId,
  context = {},
}) => {
  const existingProduct = await productRepository.findProductBySku(spaceId, body.sku);

  if (existingProduct) throw new AppError("Product SKU already exists", 400);

  const product = await productRepository.createProduct({
    ...body,
    spaceId,
    createdBy: userId,
    updatedBy: userId,
  });

  logger.info(`Product created productId=${product._id}`);

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITY_TYPES.PRODUCT,
    entityId: product._id,
    before: null,
    after: product,
    metadata: {
      sku: product.sku,
    },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return product;
};

// Handles get products.
const getProducts = async ({ spaceId, page, limit }) => productRepository.getProducts({ spaceId, page, limit });

// Handles update product.
const updateProduct = async ({
  productId,
  body,
  userId,
  context = {},
}) => {
  const product = await productRepository.findProductById(productId);

  if (!product) throw new AppError("Product not found", 404);

  const updatedProduct = await productRepository.updateProduct(productId, {
    ...body,
    updatedBy: userId,
  });

  logger.info(`Product updated productId=${productId}`);

  await auditLogService.recordAuditLog({
    spaceId: product.spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: AUDIT_ENTITY_TYPES.PRODUCT,
    entityId: productId,
    before: product,
    after: updatedProduct,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return updatedProduct;
};

// Handles delete product.
const deleteProduct = async ({
  productId,
  userId,
  context = {},
}) => {
  const product = await productRepository.findProductById(productId);

  if (!product) throw new AppError("Product not found", 404);

  const deletedProduct =
    await productRepository.softDeleteProduct(productId, userId);

  logger.info(`Product deleted productId=${productId}`);

  await auditLogService.recordAuditLog({
    spaceId: product.spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.DELETE,
    entityType: AUDIT_ENTITY_TYPES.PRODUCT,
    entityId: productId,
    before: product,
    after: deletedProduct,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });
};

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};


