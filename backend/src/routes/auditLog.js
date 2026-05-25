const express = require("express");

const { getAuditLogs } = require("../controllers/auditLog");

const authMiddleware = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.get("/", authMiddleware, requireAdmin, getAuditLogs);

module.exports = router;
