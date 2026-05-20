const express = require("express");

const inventoryController = require("../controllers/inventory.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

const {
  INVENTORY_PERMISSIONS,
} = require("../constants/inventory.constant");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  authorize(INVENTORY_PERMISSIONS.CREATE_INVENTORY),
  inventoryController.createInventoryItem
);

router.get(
  "/",
  authMiddleware,
  authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY),
  inventoryController.getInventoryItems
);

router.get(
  "/:id",
  authMiddleware,
  authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY),
  inventoryController.getInventoryItemById
);

router.patch(
  "/:id",
  authMiddleware,
  authorize(INVENTORY_PERMISSIONS.UPDATE_INVENTORY),
  inventoryController.updateInventoryItem
);

router.delete(
  "/:id",
  authMiddleware,
  authorize(INVENTORY_PERMISSIONS.DELETE_INVENTORY),
  inventoryController.deleteInventoryItem
);

module.exports = router;