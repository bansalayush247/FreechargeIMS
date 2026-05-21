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

router.use(ROUTES.AUTH.BASE, authRoutes);
router.use(ROUTES.SPACES.BASE, spaceRoutes);
router.use(ROUTES.ROLES.BASE, roleRoutes);
router.use(ROUTES.SPACE_MEMBERS, spaceMemberRoutes);
router.use(ROUTES.PRODUCTS.BASE, productRoutes);
router.use(ROUTES.WAREHOUSE.BASE, warehouseRoutes);
router.use(ROUTES.INVENTORY_ITEMS, inventoryRoutes);
router.use(ROUTES.INVENTORY_TRANSACTIONS.BASE, inventoryTransactionRoutes);
router.use(ROUTES.ASSET_REQUESTS.BASE, assetRequestRoutes);
router.use(ROUTES.REPAIRS.BASE, repairRoutes);
router.use(ROUTES.NOTIFICATIONS.BASE, notificationRoutes);
router.use(ROUTES.WORKFLOWS.BASE, workflowRoutes);
router.use(ROUTES.AUDIT_LOGS.BASE, auditLogRoutes);
router.use(ROUTES.LOGS.BASE, logsRoutes);

module.exports = router;
