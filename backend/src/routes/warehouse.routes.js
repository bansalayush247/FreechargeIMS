const express = require("express");

const router = express.Router();

const warehouseController = require(
  "../controllers/warehouse.controller"
);

const authMiddleware = require(
  "../middleware/auth.middleware"
);

const validateSpaceId = require(
  "../middleware/validateSpaceId.middleware"
);

const validate = require(
  "../middleware/validate.middleware"
);

const {
  createWarehouseSchema,
  updateWarehouseSchema,
} = require(
  "../validators/warehouse.validation"
);

router.post(
  "/",
  authMiddleware,
  validateSpaceId,
  validate(createWarehouseSchema),
  warehouseController.createWarehouse
);

router.get(
  "/",
  authMiddleware,
  validateSpaceId,
  warehouseController.getWarehouses
);

router.patch(
  "/:id",
  authMiddleware,
  validate(updateWarehouseSchema),
  warehouseController.updateWarehouse
);

router.delete(
  "/:id",
  authMiddleware,
  warehouseController.deleteWarehouse
);

module.exports = router;