const fs = require("fs");
const path = require("path");
const asyncHandler = require("express-async-handler");
const logger = require("../config/logger");
const { archiveLogs, cleanupOldArchives } = require("../jobs/logArchiver");

const LOGS_DIR = path.resolve(__dirname, "../../../src/logs");
const ARCHIVES_DIR = path.join(LOGS_DIR, "archives");
const COMBINED_LOG_PATH = path.join(LOGS_DIR, "combined.log");

/**
 * Manually trigger log archival
 */
const triggerLogArchival = asyncHandler(async (req, res) => {
  try {
    await archiveLogs();

    res.status(200).json({
      success: true,
      message: "Log archival triggered successfully",
    });
  } catch (error) {
    logger.error("Error triggering log archival:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger log archival",
      error: error.message,
    });
  }
});

/**
 * Get list of archived log files
 */
const getArchivedLogs = asyncHandler(async (req, res) => {
  try {
    if (!fs.existsSync(ARCHIVES_DIR)) {
      return res.status(200).json({
        success: true,
        message: "No archived logs found",
        data: [],
      });
    }

    const files = fs
      .readdirSync(ARCHIVES_DIR)
      .filter((file) => file.endsWith(".zip"))
      .map((file) => {
        const filePath = path.join(ARCHIVES_DIR, file);
        const stats = fs.statSync(filePath);

        return {
          filename: file,
          size: stats.size,
          sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
          createdAt: stats.mtime,
          createdAtFormatted: new Date(stats.mtime).toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      message: `Found ${files.length} archived log files`,
      data: files,
    });
  } catch (error) {
    logger.error("Error retrieving archived logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve archived logs",
      error: error.message,
    });
  }
});

/**
 * Delete archived log file
 */
const deleteArchivedLog = asyncHandler(async (req, res) => {
  try {
    const { filename } = req.params;

    // Validate filename to prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    const filePath = path.join(ARCHIVES_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Archive file not found",
      });
    }

    fs.unlinkSync(filePath);

    logger.info(`Deleted archived log file: ${filename}`);

    res.status(200).json({
      success: true,
      message: `Successfully deleted archive: ${filename}`,
    });
  } catch (error) {
    logger.error("Error deleting archived log:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete archived log",
      error: error.message,
    });
  }
});

/**
 * Cleanup old archives
 */
const cleanupArchives = asyncHandler(async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.query;

    cleanupOldArchives(parseInt(daysToKeep));

    res.status(200).json({
      success: true,
      message: `Cleanup completed. Keeping archives from last ${daysToKeep} days`,
    });
  } catch (error) {
    logger.error("Error cleaning up archives:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup archives",
      error: error.message,
    });
  }
});

/**
 * Get current log status
 */
const getLogStatus = asyncHandler(async (req, res) => {
  try {
    const logFiles = fs
      .readdirSync(LOGS_DIR)
      .filter((file) => file.endsWith(".log"))
      .map((file) => {
        const filePath = path.join(LOGS_DIR, file);
        const stats = fs.statSync(filePath);

        return {
          filename: file,
          size: stats.size,
          sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
          lastModified: stats.mtime,
          lastModifiedFormatted: new Date(stats.mtime).toISOString(),
        };
      });

    const archiveCount = fs.existsSync(ARCHIVES_DIR)
      ? fs
          .readdirSync(ARCHIVES_DIR)
          .filter((file) => file.endsWith(".zip")).length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        currentLogs: logFiles,
        archivedLogsCount: archiveCount,
        totalLogSize: logFiles.reduce((sum, f) => sum + f.size, 0),
        totalLogSizeInMB: (logFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)).toFixed(2),
      },
    });
  } catch (error) {
    logger.error("Error getting log status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get log status",
      error: error.message,
    });
  }
});

/**
 * Ingest frontend logs (lightweight)
 * Accepts: { level, message, meta, timestamp }
 * Appends a JSON line to combined.log
 */
const ingestLog = asyncHandler(async (req, res) => {
  try {
    const {
      level = "info",
      message = "",
      meta = {},
      timestamp = new Date().toISOString(),
      source = "frontend",
    } = req.body || {};

    // Basic validation
    if (typeof message !== "string" || message.length > 2000) {
      return res.status(400).json({ success: false, message: "Invalid message" });
    }

    const safeLevel = ["debug", "info", "warn", "error"].includes(level) ? level : "info";

    const normalizedSource = source === "backend" ? "backend" : "frontend";
    const prefixedMessage = typeof message === "string" && !message.startsWith(`[${normalizedSource}]`)
      ? `[${normalizedSource}] ${message}`
      : message;

    const line = JSON.stringify({
      level: safeLevel,
      source: normalizedSource,
      message: prefixedMessage,
      meta,
      timestamp,
    }) + "\n";

    // Ensure logs dir exists
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }

    fs.appendFileSync(COMBINED_LOG_PATH, line, { encoding: "utf8" });

    return res.status(201).json({ success: true, message: "Logged" });
  } catch (error) {
    logger.error("Error ingesting frontend log:", error);
    return res.status(500).json({ success: false, message: "Failed to ingest log" });
  }
});

module.exports = {
  triggerLogArchival,
  getArchivedLogs,
  deleteArchivedLog,
  cleanupArchives,
  getLogStatus,
  ingestLog,
};
