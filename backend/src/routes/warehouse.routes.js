const express = require("express");

const router = express.Router();

const warehouseController = require(
  "../controllers/warehouse"
);

const authMiddleware = require(
  "../middleware/auth"
);

const validateSpaceId = require(
  "../middleware/validateSpaceId"
);

const validate = require(
  "../middleware/validate"
);

const {
  createWarehouseSchema,
  updateWarehouseSchema,
} = require(
  "../validators/warehouse"
);

const ROUTES = require("../constants/routes");

router.post(
  ROUTES.WAREHOUSE.CREATE,
  authMiddleware,
  validateSpaceId,
  validate(createWarehouseSchema),
  warehouseController.createWarehouse
);

router.get(
  ROUTES.WAREHOUSE.LIST,
  authMiddleware,
  validateSpaceId,
  warehouseController.getWarehouses
);

router.patch(
  ROUTES.WAREHOUSE.UPDATE,
  authMiddleware,
  validate(updateWarehouseSchema),
  warehouseController.updateWarehouse
);

router.delete(
  ROUTES.WAREHOUSE.DELETE,
  authMiddleware,
  warehouseController.deleteWarehouse
);

module.exports = router;