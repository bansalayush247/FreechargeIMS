const express = require("express");

const router = express.Router();

const inventoryTransactionController = require("../controllers/inventoryTransaction");

const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateSpaceId = require("../middleware/validateSpaceId");

const { INVENTORY_TRANSACTION_PERMISSIONS } = require("../constants/inventoryTransaction");

const ROUTES = require("../constants/routes");

router.post(ROUTES.INVENTORY_TRANSACTION_ROUTES.CREATE, authMiddleware, validateSpaceId, authorize(INVENTORY_TRANSACTION_PERMISSIONS.CREATE_INVENTORY_TRANSACTION), inventoryTransactionController.createTransaction);
router.get(ROUTES.INVENTORY_TRANSACTION_ROUTES.LIST, authMiddleware, validateSpaceId, authorize(INVENTORY_TRANSACTION_PERMISSIONS.VIEW_INVENTORY_TRANSACTION), inventoryTransactionController.getTransactions);
router.get(ROUTES.INVENTORY_TRANSACTION_ROUTES.ITEM_AUDIT_TRAIL, authMiddleware, validateSpaceId, inventoryTransactionController.getItemAuditTrail);
router.get(ROUTES.INVENTORY_TRANSACTION_ROUTES.GET_BY_ID, authMiddleware, validateSpaceId, authorize(INVENTORY_TRANSACTION_PERMISSIONS.VIEW_INVENTORY_TRANSACTION), inventoryTransactionController.getTransactionById);

module.exports = router;
