const mongoose = require("mongoose");
const logger = require("../config/logger");

async function connectDB() {
  try {

    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected");

  } catch (error) {

    logger.error("MongoDB connection failed", error);
    process.exit(1);
  }
}

module.exports = connectDB;