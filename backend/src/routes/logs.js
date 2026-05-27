const express = require("express");

const {
  triggerLogArchival,
  getArchivedLogs,
  deleteArchivedLog,
  cleanupArchives,
  getLogStatus,
  ingestLog,
} = require("../controllers/logs");

const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { PERMISSIONS } = require("../constants/permission");

const router = express.Router();

// Public ingest endpoint for frontend logs (no auth required)
router.post("/", ingestLog);

/**
 * Log management routes
 * All routes require authentication and admin privileges
 */

/**
 * GET /api/v1/logs/status
 * Get current log status
 */
router.get("/status", authMiddleware, authorize(PERMISSIONS.MANAGE_LOGS), getLogStatus);

/**
 * GET /api/v1/logs/archives
 * Get list of archived logs
 */
router.get("/archives", authMiddleware, authorize(PERMISSIONS.MANAGE_LOGS), getArchivedLogs);

/**
 * POST /api/v1/logs/archive
 * Manually trigger log archival
 */
router.post("/archive", authMiddleware, authorize(PERMISSIONS.MANAGE_LOGS), triggerLogArchival);

/**
 * DELETE /api/v1/logs/archives/:filename
 * Delete specific archived log file
 */
router.delete("/archives/:filename", authMiddleware, authorize(PERMISSIONS.MANAGE_LOGS), deleteArchivedLog);

/**
 * POST /api/v1/logs/cleanup
 * Cleanup old archives
 * Query params:
 *   - daysToKeep: number of days to keep (default: 30)
 */
router.post("/cleanup", authMiddleware, authorize(PERMISSIONS.MANAGE_LOGS), cleanupArchives);

module.exports = router;
