const express = require("express");

const router = express.Router();

const auditLogController = require(
  "../controllers/auditLog.controller"
);

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

const {
  AUDIT_LOG_PERMISSIONS,
} = require("../constants/auditLog.constant");

router.get(
  "/",
  authMiddleware,
  authorize(AUDIT_LOG_PERMISSIONS.VIEW_AUDIT_LOGS),
  auditLogController.getAuditLogs
);

router.get(
  "/:id",
  authMiddleware,
  authorize(AUDIT_LOG_PERMISSIONS.VIEW_AUDIT_LOGS),
  auditLogController.getAuditLogById
);

module.exports = router;
