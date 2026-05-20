const express = require("express");

const router = express.Router();

const repairController = require(
  "../controllers/repair.controller"
);

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

const {
  REPAIR_PERMISSIONS,
} = require("../constants/repair.constant");

router.post(
  "/",
  authMiddleware,
  authorize(REPAIR_PERMISSIONS.CREATE_REPAIR),
  repairController.createRepair
);

router.get(
  "/",
  authMiddleware,
  authorize(REPAIR_PERMISSIONS.VIEW_REPAIR),
  repairController.getRepairs
);

router.get(
  "/:id",
  authMiddleware,
  authorize(REPAIR_PERMISSIONS.VIEW_REPAIR),
  repairController.getRepairById
);

router.patch(
  "/:id",
  authMiddleware,
  authorize(REPAIR_PERMISSIONS.UPDATE_REPAIR),
  repairController.updateRepair
);

router.patch(
  "/:id/complete",
  authMiddleware,
  authorize(REPAIR_PERMISSIONS.COMPLETE_REPAIR),
  repairController.completeRepair
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  authorize(REPAIR_PERMISSIONS.CANCEL_REPAIR),
  repairController.cancelRepair
);

module.exports = router;
