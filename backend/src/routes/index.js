const express = require("express");

const { getApiStatus } = require("../controllers/api");
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
const notificationRoutes = require("./notification.routes");
const workflowRoutes = require("./workflow.routes");
const auditLogRoutes = require("./auditLog.routes");
const logsRoutes = require("./logs.routes");

const ROUTES = require("../constants/routes");

const router = express.Router();

router.get(ROUTES.BASE, getApiStatus);

router.use(ROUTES.AUTH, authRoutes);
router.use(ROUTES.SPACES, spaceRoutes);
router.use(ROUTES.ROLES, roleRoutes);
router.use(ROUTES.SPACE_MEMBERS, spaceMemberRoutes);
router.use(ROUTES.PRODUCTS, productRoutes);
router.use(ROUTES.WAREHOUSE, warehouseRoutes);
router.use(ROUTES.INVENTORY_ITEMS, inventoryRoutes);
router.use(ROUTES.INVENTORY_TRANSACTIONS, inventoryTransactionRoutes);
router.use(ROUTES.ASSET_REQUESTS, assetRequestRoutes);
router.use(ROUTES.REPAIRS, repairRoutes);
router.use(ROUTES.NOTIFICATIONS, notificationRoutes);
router.use(ROUTES.WORKFLOWS, workflowRoutes);
router.use(ROUTES.AUDIT_LOGS, auditLogRoutes);
router.use(ROUTES.LOGS, logsRoutes);

module.exports = router;
