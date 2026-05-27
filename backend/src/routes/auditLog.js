const express = require("express");

const { getAuditLogs } = require("../controllers/auditLog");

const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { PERMISSIONS } = require("../constants/permission");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  authorize(PERMISSIONS.VIEW_AUDIT_LOGS),
  getAuditLogs
);

module.exports = router;
