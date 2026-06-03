const express = require("express");

const router = express.Router();

router.use((_req, res, next) => {
  res.setHeader("Deprecation", "true");
  res.setHeader("Sunset", "TBD");
  next();
});

const warehouseController = require("../controllers/warehouse");
const authMiddleware = require("../middleware/auth");
const validateSpaceId = require("../middleware/validateSpaceId");
const validate = require("../middleware/validate");
const authorize = require("../middleware/authorize");
const { PERMISSIONS } = require("../constants/permission");

const { createWarehouseSchema, updateWarehouseSchema } = require("../validators/warehouse");

const ROUTES = require("../constants/routes");

router.post(ROUTES.WAREHOUSE.CREATE, authMiddleware, validateSpaceId, authorize(PERMISSIONS.CREATE_WAREHOUSE), validate(createWarehouseSchema), warehouseController.createWarehouse);
router.get(ROUTES.WAREHOUSE.LIST, authMiddleware, validateSpaceId, authorize(PERMISSIONS.VIEW_WAREHOUSE), warehouseController.getWarehouses);
router.patch(ROUTES.WAREHOUSE.UPDATE, authMiddleware, validateSpaceId, authorize(PERMISSIONS.UPDATE_WAREHOUSE), validate(updateWarehouseSchema), warehouseController.updateWarehouse);
router.delete(ROUTES.WAREHOUSE.DELETE, authMiddleware, validateSpaceId, authorize(PERMISSIONS.DELETE_WAREHOUSE), warehouseController.deleteWarehouse);

module.exports = router;
