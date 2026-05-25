const express = require("express");

const router = express.Router();

const productController = require("../controllers/product");

const authMiddleware = require("../middleware/auth");

const validateSpaceId = require("../middleware/validateSpaceId");

const validate = require("../middleware/validate");

const { createProductSchema, updateProductSchema } = require("../validators/product");

const ROUTES = require("../constants/routes");

router.post(ROUTES.PRODUCTS.CREATE, authMiddleware, validateSpaceId, validate(createProductSchema), productController.createProduct);

router.get(ROUTES.PRODUCTS.LIST, authMiddleware, validateSpaceId, productController.getProducts);

router.patch(ROUTES.PRODUCTS.UPDATE, authMiddleware, validate(updateProductSchema), productController.updateProduct);

router.delete(ROUTES.PRODUCTS.DELETE, authMiddleware, productController.deleteProduct);

module.exports = router;
