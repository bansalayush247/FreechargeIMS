const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const InventoryItem = require("../models/inventory");
const InventoryTransaction = require("../models/inventoryTransaction");
const logger = require("../config/logger");

const statusMap = {
  AVAILABLE: "IN_STOCK",
  RETIRED: "DISPOSED",
};

const transactionTypeMap = {
  ASSIGNED: "ASSIGN",
  RETURNED: "RETURN",
  TRANSFERRED: "TRANSFER",
  RETIRED: "DISPOSE",
};

// Handles migrate lifecycle values.
const migrateLifecycle = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    for (const [from, to] of Object.entries(statusMap)) {
      const inventoryResult = await InventoryItem.updateMany(
        { status: from },
        { $set: { status: to } }
      );

      const previousStatusResult =
        await InventoryTransaction.updateMany(
          { previousStatus: from },
          { $set: { previousStatus: to } }
        );

      const newStatusResult = await InventoryTransaction.updateMany(
        { newStatus: from },
        { $set: { newStatus: to } }
      );

      logger.info("Lifecycle status migrated", {
        from,
        to,
        inventoryModified: inventoryResult.modifiedCount,
        previousStatusModified: previousStatusResult.modifiedCount,
        newStatusModified: newStatusResult.modifiedCount,
      });
    }

    for (const [from, to] of Object.entries(transactionTypeMap)) {
      const result = await InventoryTransaction.updateMany(
        { transactionType: from },
        { $set: { transactionType: to } }
      );

      logger.info("Transaction type migrated", {
        from,
        to,
        modified: result.modifiedCount,
      });
    }

    logger.info("Lifecycle migration completed");
    process.exit(0);
  } catch (error) {
    logger.error("Lifecycle migration failed", {
      error: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
};

migrateLifecycle();
