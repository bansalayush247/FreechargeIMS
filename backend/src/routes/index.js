const express = require("express");

const { getApiStatus } = require("../controllers/api.controller");
const authRoutes = require("./auth.routes");
const productRoutes = require("./product.routes");
const warehouseRoutes = require("./warehouse.routes");
const spaceRoutes = require("./space.routes");
const roleRoutes = require("./role.routes");
const spaceMemberRoutes = require("./spaceMember.routes");
const inventoryRoutes = require("./inventory.routes");
const inventoryTransactionRoutes = require("./inventoryTransaction.routes");
const assetRequestRoutes = require("./assetRequest.routes");
const repairRoutes = require("./repair.routes");
const auditLogRoutes = require("./auditLog.routes");

const router = express.Router();

router.get("/", getApiStatus);

router.use("/auth", authRoutes);
router.use("/spaces", spaceRoutes);
router.use("/roles", roleRoutes);
router.use("/space-members", spaceMemberRoutes);
router.use("/product", productRoutes);
router.use("/warehouse", warehouseRoutes);
router.use("/inventory-items", inventoryRoutes);
router.use("/inventoryTransactions", inventoryTransactionRoutes);
router.use("/asset-requests", assetRequestRoutes);
router.use("/repairs", repairRoutes);
router.use("/audit-logs", auditLogRoutes);

module.exports = router;
