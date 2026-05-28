const express = require("express");

const router = express.Router();

const productController = require("../controllers/product");

const authMiddleware = require("../middleware/auth");

const validateSpaceId = require("../middleware/validateSpaceId");

const validate = require("../middleware/validate");
const authorize = require("../middleware/authorize");

const { createProductSchema, updateProductSchema } = require("../validators/product");
const { PERMISSIONS } = require("../constants/permission");

const ROUTES = require("../constants/routes");

router.post(
  ROUTES.PRODUCTS.CREATE,
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.CREATE_PRODUCT),
  validate(createProductSchema),
  productController.createProduct
);

router.get(
  ROUTES.PRODUCTS.LIST,
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.VIEW_PRODUCT),
  productController.getProducts
);

router.patch(
  ROUTES.PRODUCTS.UPDATE,
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.UPDATE_PRODUCT),
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete(
  ROUTES.PRODUCTS.DELETE,
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.DELETE_PRODUCT),
  productController.deleteProduct
);

module.exports = router;
