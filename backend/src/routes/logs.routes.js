const express = require("express");

const {
  triggerLogArchival,
  getArchivedLogs,
  deleteArchivedLog,
  cleanupArchives,
  getLogStatus,
} = require("../controllers/logs");

const requireAdmin = require("../middleware/requireAdmin");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

/**
 * Log management routes
 * All routes require authentication and admin privileges
 */

/**
 * GET /api/v1/logs/status
 * Get current log status
 */
router.get("/status", authMiddleware, requireAdmin, getLogStatus);

/**
 * GET /api/v1/logs/archives
 * Get list of archived logs
 */
router.get("/archives", authMiddleware, requireAdmin, getArchivedLogs);

/**
 * POST /api/v1/logs/archive
 * Manually trigger log archival
 */
router.post("/archive", authMiddleware, requireAdmin, triggerLogArchival);

/**
 * DELETE /api/v1/logs/archives/:filename
 * Delete specific archived log file
 */
router.delete("/archives/:filename", authMiddleware, requireAdmin, deleteArchivedLog);

/**
 * POST /api/v1/logs/cleanup
 * Cleanup old archives
 * Query params:
 *   - daysToKeep: number of days to keep (default: 30)
 */
router.post("/cleanup", authMiddleware, requireAdmin, cleanupArchives);

module.exports = router;
