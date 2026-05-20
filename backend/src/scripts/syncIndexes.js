const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const logger = require("../config/logger");

require("../models/space.model");
require("../models/role.model");
require("../models/userRole.model");
require("../models/spaceMember.model");
require("../models/product.model");
require("../models/warehouse.model");
require("../models/inventory.model");
require("../models/assetRequest.model");
require("../models/repair.model");
require("../models/auditLog.model");
require("../models/inventoryTransaction.model");

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
