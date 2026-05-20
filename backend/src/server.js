require("dotenv").config();

const app = require("./app");
const connectDB = require("./database/db");
const logger = require("./config/logger");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

  } catch (error) {
    logger.error("Server startup failed", error);
    process.exit(1);
  }
}

startServer();