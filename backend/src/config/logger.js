const winston = require("winston");
const path = require("path");
const fs = require("fs");

const { getRequestContext } = require("../middleware/contextLogger");
const { sanitizeForLogging } = require("../utils/logSanitizer");

const LOGS_DIR = process.env.LOGS_DIR
  ? path.resolve(process.env.LOGS_DIR)
  : path.resolve(__dirname, "../../../src/logs");

fs.mkdirSync(LOGS_DIR, { recursive: true });

// Enriched with requestId, userId, and source
const enrichWithContext = winston.format((info) => {
  const context = getRequestContext() || {};

  info.requestId = info.requestId || context.requestId || "SYSTEM";
  info.userId = info.userId || context.userId || "GUEST";
  info.source = info.source || context.source || "backend"; // Default to backend

  Object.entries(info).forEach(([key, value]) => {
    info[key] = sanitizeForLogging({ [key]: value })[key];
  });

  return info;
});

// Layout displaying request, user, and source tags
const developmentFormat = winston.format.printf((info) => {
  const {
    timestamp,
    level,
    message,
    requestId,
    userId,
    source,
    stack,
    ...metadata
  } = info;
  
  const context = `requestId=${requestId} userId=${userId} source=${source}`;
  const details = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : "";

  return `${timestamp} ${level} [${context}] ${stack || message}${details}`;
});

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  enrichWithContext(),
  process.env.NODE_ENV === "production"
    ? winston.format.json()
    : developmentFormat
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(LOGS_DIR, "combined.log"),
    })
  ],
});

module.exports = logger;