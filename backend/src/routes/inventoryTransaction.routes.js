const express = require("express");

const router = express.Router();

const inventoryTransactionController = require(
  "../controllers/inventoryTransaction.controller"
);

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

const {
  INVENTORY_TRANSACTION_PERMISSIONS,
} = require(
  "../constants/inventoryTransaction.constant"
);

router.post(
  "/",
  authMiddleware,
  authorize(
    INVENTORY_TRANSACTION_PERMISSIONS.CREATE_INVENTORY_TRANSACTION
  ),
  inventoryTransactionController.createTransaction
);

router.get(
  "/",
  authMiddleware,
  authorize(
    INVENTORY_TRANSACTION_PERMISSIONS.VIEW_INVENTORY_TRANSACTION
  ),
  inventoryTransactionController.getTransactions
);

router.get(
  "/item/:inventoryItemId",
  authMiddleware,
  authorize(
    INVENTORY_TRANSACTION_PERMISSIONS.VIEW_INVENTORY_TRANSACTION
  ),
  inventoryTransactionController.getItemAuditTrail
);

router.get(
  "/:id",
  authMiddleware,
  authorize(
    INVENTORY_TRANSACTION_PERMISSIONS.VIEW_INVENTORY_TRANSACTION
  ),
  inventoryTransactionController.getTransactionById
);

module.exports = router;