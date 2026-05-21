require("dotenv").config();

const app = require("./app");
const connectDB = require("./database/db");
const logger = require("./config/logger");
const { initializeLogArchiver } = require("./jobs/logArchiver");

const PORT = process.env.PORT || 5000;

// Handles start server.
async function startServer() {
  try {
    await connectDB();

    // Initialize log archiver job
    initializeLogArchiver();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

  } catch (error) {
    logger.error("Server startup failed", error);
    process.exit(1);
  }
}

startServer();