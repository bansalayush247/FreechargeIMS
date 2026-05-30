const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const logger = require("../config/logger");
const User = require("../models/user");
const Space = require("../models/space");

const { SPACE_CODES, SPACE_TYPES } = require("../constants/space");

const LEGACY_USER_TYPES = ["OPS", "FOS", "SUPPORT", "FINANCE", "WAREHOUSE"];
const SYSTEM_SPACE_CODES = new Set(Object.values(SPACE_CODES));

async function migrateUserAndSpaceTypes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const userResult = await User.updateMany(
      {
        userType: { $in: LEGACY_USER_TYPES },
      },
      {
        $set: { userType: SPACE_TYPES.EMPLOYEE },
      }
    );

    const legacySpaces = await Space.find({
      isDeleted: { $ne: true },
      $or: [
        { type: { $exists: false } },
        { type: null },
        { type: "" },
      ],
    });

    let spaceUpdatedCount = 0;

    for (const space of legacySpaces) {
      if (space.code && SYSTEM_SPACE_CODES.has(space.code)) {
        continue;
      }

      if (Object.values(SPACE_TYPES).includes(space.code)) {
        space.type = space.code;
      } else {
        space.type = SPACE_TYPES.EMPLOYEE;
      }

      await space.save();
      spaceUpdatedCount += 1;
    }

    logger.info("User and space type migration completed", {
      usersUpdated: userResult.modifiedCount,
      spacesUpdated: spaceUpdatedCount,
    });

    process.exit(0);
  } catch (error) {
    logger.error("User and space type migration failed", {
      error: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
}

migrateUserAndSpaceTypes();
