const express = require("express");

const { getApiStatus } = require("../controllers/api");
const authRoutes = require("./auth");
const productRoutes = require("./product");
const warehouseRoutes = require("./warehouse");
const spaceRoutes = require("./space");
const roleRoutes = require("./role");
const spaceMemberRoutes = require("./spaceMember");
const inventoryRoutes = require("./inventory");
const inventoryTransactionRoutes = require("./inventoryTransaction");
const assetRequestRoutes = require("./assetRequest");
const repairRoutes = require("./repair");
const notificationRoutes = require("./notification");
const workflowRoutes = require("./workflow");
const auditLogRoutes = require("./auditLog");
const logsRoutes = require("./logs");

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
