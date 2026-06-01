const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const logger = require("../config/logger");
const InventoryItem = require("../models/inventory");
const Product = require("../models/product");
const AssetTagCounter = require("../models/assetTagCounter");
const { PRODUCT_ASSET_TYPES } = require("../constants/product");

const PREFIX_BY_CATEGORY = Object.freeze({
  LAPTOPS: "LAP",
  DESKTOPS: "DSK",
  MONITORS: "MON",
  MOBILES: "MOB",
  TABLETS: "TAB",
  POS_DEVICES: "POS",
  PRINTERS: "PRN",
  SCANNERS: "SCN",
  ROUTERS_SWITCHES: "NET",
  NETWORKING_EQUIPMENT: "NET",
  PERIPHERALS: "PER",
  ACCESSORIES: "ACC",
  SECURITY_DEVICES: "SEC",
  SOFTWARE_LICENSES: "SW",
  BIOMETRIC_DEVICES: "BIO",
  CHARGERS_ADAPTERS: "CHG",
  HEADSETS_AUDIO: "AUD",
  STORAGE_DEVICES: "STO",
});

function buildPrefix(product) {
  const category = String(product?.category || "").trim().toUpperCase();

  if (PREFIX_BY_CATEGORY[category]) {
    return PREFIX_BY_CATEGORY[category];
  }

  return String(product?.sku || product?.name || "AST")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");
}

async function nextAssetTag(prefix) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const counter = await AssetTagCounter.findOneAndUpdate(
      { _id: prefix },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    ).lean();
    const assetTag = `FC-${prefix}-${String(counter.seq).padStart(6, "0")}`;
    const exists = await InventoryItem.exists({ assetTag, isDeleted: false });

    if (!exists) {
      return assetTag;
    }
  }

  throw new Error(`Unable to generate unique assetTag for prefix ${prefix}`);
}

async function syncCountersFromExistingTags() {
  const items = await InventoryItem.find({
    assetTag: /^FC-[A-Z0-9]{3}-\d{6}$/,
    isDeleted: false,
  })
    .select("assetTag")
    .lean();

  const maxByPrefix = new Map();

  for (const item of items) {
    const [, prefix, sequence] = String(item.assetTag).match(/^FC-([A-Z0-9]{3})-(\d{6})$/) || [];

    if (!prefix || !sequence) {
      continue;
    }

    maxByPrefix.set(prefix, Math.max(maxByPrefix.get(prefix) || 0, Number(sequence)));
  }

  for (const [prefix, seq] of maxByPrefix.entries()) {
    await AssetTagCounter.findOneAndUpdate(
      { _id: prefix },
      { $max: { seq } },
      { upsert: true }
    );
  }
}

async function migrateInventoryAssetIdentifiers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await syncCountersFromExistingTags();

    const missingTaggedItems = await InventoryItem.find({
      isDeleted: false,
      $or: [{ assetTag: { $exists: false } }, { assetTag: null }, { assetTag: "" }],
    }).lean();

    let backfilledAssetTags = 0;

    for (const item of missingTaggedItems) {
      const product = await Product.findOne({
        _id: item.productId,
        assetType: PRODUCT_ASSET_TYPES.NON_CONSUMABLE,
        isDeleted: false,
      }).lean();

      if (!product) {
        continue;
      }

      await InventoryItem.updateOne(
        { _id: item._id },
        { $set: { assetTag: await nextAssetTag(buildPrefix(product)) } }
      );
      backfilledAssetTags += 1;
    }

    const unsetResult = await InventoryItem.collection.updateMany(
      { qrCode: { $exists: true } },
      { $unset: { qrCode: "" } }
    );

    await InventoryItem.syncIndexes();
    await AssetTagCounter.syncIndexes();

    logger.info("Inventory asset identifier migration completed", {
      backfilledAssetTags,
      removedQrCodeFields: unsetResult.modifiedCount,
    });

    process.exit(0);
  } catch (error) {
    logger.error("Inventory asset identifier migration failed", {
      error: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
}

migrateInventoryAssetIdentifiers();
