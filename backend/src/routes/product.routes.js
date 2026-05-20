const express = require("express");

const router = express.Router();

const productController = require("../controllers/product.controller");

const authMiddleware = require("../middleware/auth.middleware");

const validateSpaceId = require("../middleware/validateSpaceId.middleware");

const validate = require("../middleware/validate.middleware");

const { createProductSchema, updateProductSchema } = require("../validators/product.validation");

router.post("/", authMiddleware, validateSpaceId, validate(createProductSchema), productController.createProduct);

router.get("/", authMiddleware, validateSpaceId, productController.getProducts);

router.patch("/:id", authMiddleware, validate(updateProductSchema), productController.updateProduct);

router.delete("/:id", authMiddleware, productController.deleteProduct);

module.exports = router;