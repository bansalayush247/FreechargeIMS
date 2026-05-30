const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const logger = require("../config/logger");
const Product = require("../models/product");

function normalizeSku(sku) {
  return String(sku || "").trim().toUpperCase();
}

function buildArchivedSku(baseSku, productId) {
  return `${baseSku}__ARCHIVED__${String(productId).slice(-6).toUpperCase()}`;
}

function compareProducts(left, right) {
  if (left.isDeleted !== right.isDeleted) {
    return left.isDeleted ? 1 : -1;
  }

  const leftTime = new Date(left.createdAt || 0).getTime();
  const rightTime = new Date(right.createdAt || 0).getTime();

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return String(left._id).localeCompare(String(right._id));
}

async function migrateProductSkuUniqueness() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const products = await Product.find({
      sku: { $exists: true, $ne: "" },
    })
      .select("_id sku isDeleted createdAt deletedAt deletedBy")
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    const groupedProducts = new Map();

    for (const product of products) {
      const normalizedSku = normalizeSku(product.sku);

      if (!groupedProducts.has(normalizedSku)) {
        groupedProducts.set(normalizedSku, []);
      }

      groupedProducts.get(normalizedSku).push(product);
    }

    const duplicateGroups = [];
    const bulkOperations = [];
    let normalizedCount = 0;
    let archivedCount = 0;

    for (const [normalizedSku, items] of groupedProducts.entries()) {
      if (!items.length) {
        continue;
      }

      const sortedItems = [...items].sort(compareProducts);
      const canonicalProduct = sortedItems[0];

      if (canonicalProduct.sku !== normalizedSku) {
        bulkOperations.push({
          updateOne: {
            filter: { _id: canonicalProduct._id },
            update: { $set: { sku: normalizedSku } },
          },
        });
        normalizedCount += 1;
      }

      if (sortedItems.length > 1) {
        duplicateGroups.push({ sku: normalizedSku, count: sortedItems.length });
      }

      for (const duplicateProduct of sortedItems.slice(1)) {
        const archivedSku = buildArchivedSku(normalizedSku, duplicateProduct._id);
        const setUpdate = {
          sku: archivedSku,
        };

        if (!duplicateProduct.isDeleted) {
          setUpdate.isDeleted = true;
          setUpdate.deletedAt = new Date();
        } else if (!duplicateProduct.deletedAt) {
          setUpdate.deletedAt = new Date();
        }

        bulkOperations.push({
          updateOne: {
            filter: { _id: duplicateProduct._id },
            update: { $set: setUpdate },
          },
        });

        archivedCount += 1;
      }
    }

    if (bulkOperations.length) {
      await Product.bulkWrite(bulkOperations, { ordered: false });
    }

    await Product.syncIndexes();

    logger.info("Product SKU uniqueness migration completed", {
      totalProductsScanned: products.length,
      duplicateSkuGroups: duplicateGroups.length,
      normalizedProducts: normalizedCount,
      archivedProducts: archivedCount,
    });

    process.exit(0);
  } catch (error) {
    logger.error("Product SKU uniqueness migration failed", {
      error: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
}

migrateProductSkuUniqueness();