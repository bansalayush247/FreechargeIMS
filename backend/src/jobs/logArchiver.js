const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const cron = require("node-cron");
const logger = require("../config/logger");

/**
 * Log Archiver Job
 * Archives logs daily and removes archived log files
 */

const LOGS_DIR = path.join(__dirname, "../logs");
const ARCHIVES_DIR = path.join(LOGS_DIR, "archives");
const LOG_FILES = ["combined.log", "error.log"];

// Ensure archives directory exists

const ensureArchivesDir = () => {
  if (!fs.existsSync(ARCHIVES_DIR)) {
    fs.mkdirSync(ARCHIVES_DIR, { recursive: true });
  }
};


// Generate archive filename with timestamp

const generateArchiveFilename = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `logs-${year}-${month}-${day}-${hour}${minute}.zip`;
};

// Archive logs and clear them
const archiveLogs = async () => {
  try {
    ensureArchivesDir();

    // Check if there are any log files to archive
    const filesToArchive = LOG_FILES.filter((file) => {
      const filePath = path.join(LOGS_DIR, file);
      return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
    });

    if (filesToArchive.length === 0) {
      logger.info("No log files to archive");
      return;
    }

    const archiveFilename = generateArchiveFilename();
    const archivePath = path.join(ARCHIVES_DIR, archiveFilename);

    // Create write stream for the zip file
    const output = fs.createWriteStream(archivePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    // Handle archive events
    output.on("close", () => {
      logger.info(
        `Log archive created successfully: ${archiveFilename} (${archive.pointer()} bytes)`
      );

      // Clear archived log files
      filesToArchive.forEach((file) => {
        const filePath = path.join(LOGS_DIR, file);
        fs.writeFileSync(filePath, "");
      });

      logger.info("Archived log files cleared");

      // Run cleanup for old archives
      cleanupOldArchives();
    });

    output.on("error", (err) => {
      logger.error("Error creating log archive:", err);
    });

    archive.on("error", (err) => {
      logger.error("Archive error:", err);
    });

    archive.pipe(output);

    // Add files to archive
    filesToArchive.forEach((file) => {
      const filePath = path.join(LOGS_DIR, file);
      archive.file(filePath, { name: file });
    });

    await archive.finalize();
  } catch (error) {
    logger.error("Error archiving logs:", error);
  }
};

/**
 * Cleanup old archives (keep only last 30 days by default)
 * @param {number} daysToKeep - Number of days to keep archives (default: 30)
 */
const cleanupOldArchives = (daysToKeep = 30) => {
  try {
    if (!fs.existsSync(ARCHIVES_DIR)) {
      return;
    }

    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    fs.readdirSync(ARCHIVES_DIR).forEach((file) => {
      const filePath = path.join(ARCHIVES_DIR, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge && file.endsWith(".zip")) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted old log archive: ${file}`);
      }
    });
  } catch (error) {
    logger.error("Error cleaning up old archives:", error);
  }
};

/**
 * Initialize log archiver cron job
 * Runs daily at 1:00 AM
 */
const initializeLogArchiver = () => {
  try {
    // Schedule at 1:00 AM every day (0 1 * * *)
    // Format: minute hour day month dayOfWeek
    const job = cron.schedule("0 1 * * *", async () => {
      logger.info("Starting scheduled log archival...");
      await archiveLogs();
    });

    logger.info("Log archiver job initialized (runs daily at 1:00 AM)");

    // Store job reference for potential cleanup
    return job;
  } catch (error) {
    logger.error("Error initializing log archiver:", error);
  }
};

module.exports = {
  initializeLogArchiver,
  archiveLogs,
  cleanupOldArchives,
};
