const winston = require("winston");
const path = require("path");
const fs = require("fs");

const LOGS_DIR = process.env.LOGS_DIR
  ? path.resolve(process.env.LOGS_DIR)
  : path.resolve(__dirname, "../../logs");

fs.mkdirSync(LOGS_DIR, { recursive: true });

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format((info) => {
      info.source = info.source || "backend";

      if (typeof info.message === "string" && !info.message.startsWith("[backend]")) {
        info.message = `[backend] ${info.message}`;
      }

      return info;
    })(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),

  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: path.join(LOGS_DIR, "error.log"),
      level: "error"
    }),

    new winston.transports.File({
      filename: path.join(LOGS_DIR, "combined.log")
    })
  ]
});

module.exports = logger;
