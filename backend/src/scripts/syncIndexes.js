const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const logger = require("../config/logger");

require("../models/space");
require("../models/role");
require("../models/userRole");
require("../models/spaceMember");
require("../models/product");
require("../models/warehouse");
require("../models/inventory");
require("../models/assetRequest");
require("../models/repair");
require("../models/notification");
require("../models/auditLog");
require("../models/inventoryTransaction");

// Handles sync indexes.
const syncIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    for (const modelName of mongoose.modelNames()) {
      const model = mongoose.model(modelName);

      logger.info("Syncing indexes", {
        modelName,
      });

      await model.syncIndexes();
    }

    logger.info("Indexes synced successfully");

    process.exit(0);
  } catch (error) {
    logger.error("Index sync failed", {
      error: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
};

syncIndexes();


