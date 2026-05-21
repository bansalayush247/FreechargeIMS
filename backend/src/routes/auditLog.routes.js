const express = require("express");

const router = express.Router();

const auditLogController = require(
  "../controllers/auditLog"
);

const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const {
  AUDIT_LOG_PERMISSIONS,
} = require("../constants/auditLog");

const ROUTES = require("../constants/routes");

router.get(
  ROUTES.AUDIT_LOG_ROUTES.LIST,
  authMiddleware,
  authorize(AUDIT_LOG_PERMISSIONS.VIEW_AUDIT_LOGS),
  auditLogController.getAuditLogs
);

router.get(
  ROUTES.AUDIT_LOG_ROUTES.GET_BY_ID,
  authMiddleware,
  authorize(AUDIT_LOG_PERMISSIONS.VIEW_AUDIT_LOGS),
  auditLogController.getAuditLogById
);

module.exports = router;
