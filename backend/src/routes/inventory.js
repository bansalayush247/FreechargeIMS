const express = require("express");

const inventoryController = require("../controllers/inventory");

const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateSpaceId = require("../middleware/validateSpaceId");

const { INVENTORY_PERMISSIONS } = require("../constants/inventory");
const ROUTES = require("../constants/routes");

const router = express.Router();

router.post(ROUTES.INVENTORY_ROUTES.CREATE, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.CREATE_INVENTORY), inventoryController.createInventoryItem);
router.get(ROUTES.INVENTORY_ROUTES.LIST, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getInventoryItems);
router.get(ROUTES.INVENTORY_ROUTES.QRCODE, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getInventoryItemQrCode);
router.get(ROUTES.INVENTORY_ROUTES.GET_BY_ID, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getInventoryItemById);
router.patch(ROUTES.INVENTORY_ROUTES.UPDATE, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.UPDATE_INVENTORY), inventoryController.updateInventoryItem);
router.delete(ROUTES.INVENTORY_ROUTES.DELETE, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.DELETE_INVENTORY), inventoryController.deleteInventoryItem);

module.exports = router;
