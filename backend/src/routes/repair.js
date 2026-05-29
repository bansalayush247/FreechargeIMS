const express = require("express");

const router = express.Router();

const repairController = require("../controllers/repair");

const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const { REPAIR_PERMISSIONS } = require("../constants/repair");

const ROUTES = require("../constants/routes");

router.post(ROUTES.REPAIR_ROUTES.CREATE, authMiddleware, authorize(REPAIR_PERMISSIONS.CREATE_REPAIR), repairController.createRepair);
router.get(ROUTES.REPAIR_ROUTES.LIST, authMiddleware, authorize(REPAIR_PERMISSIONS.VIEW_REPAIR), repairController.getRepairs);
router.get(ROUTES.REPAIR_ROUTES.GET_BY_ID, authMiddleware, authorize(REPAIR_PERMISSIONS.VIEW_REPAIR), repairController.getRepairById);
router.patch(ROUTES.REPAIR_ROUTES.UPDATE, authMiddleware, authorize(REPAIR_PERMISSIONS.UPDATE_REPAIR), repairController.updateRepair);
router.patch(ROUTES.REPAIR_ROUTES.COMPLETE, authMiddleware, authorize(REPAIR_PERMISSIONS.COMPLETE_REPAIR), repairController.completeRepair);
router.patch(ROUTES.REPAIR_ROUTES.CANCEL, authMiddleware, authorize(REPAIR_PERMISSIONS.CANCEL_REPAIR), repairController.cancelRepair);

module.exports = router;
