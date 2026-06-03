const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveInventoryStockAlertStatus } = require("../../src/constants/inventory");

const inventoryStockModelPath = require.resolve("../../src/models/inventoryStock");
const repositoryPath = require.resolve("../../src/repositories/inventoryStock");

const createChain = (result) => ({
  populate() {
    return this;
  },
  sort() {
    return this;
  },
  skip() {
    return this;
  },
  limit() {
    return this;
  },
  lean() {
    return Promise.resolve(result);
  },
});

const loadRepository = (responses) => {
  delete require.cache[inventoryStockModelPath];
  delete require.cache[repositoryPath];

  const captured = [];
  const modelMock = {
    find(query) {
      captured.push({ type: "find", query });
      const filteredItems = responses.items.filter((item) => {
        if (query.availableQuantity?.$lte === 0) {
          return Number(item.availableQuantity || 0) <= 0;
        }

        if (query.reorderQuantity?.$gt > 0) {
          return Number(item.availableQuantity || 0) > 0 && Number(item.availableQuantity || 0) <= Number(item.reorderQuantity || 0);
        }

        if (query.$expr?.$lte) {
          return Number(item.availableQuantity || 0) > 0 && Number(item.availableQuantity || 0) <= Number(item.reorderLevel || 0);
        }

        return true;
      });

      return createChain(filteredItems);
    },
    countDocuments(query) {
      captured.push({ type: "count", query });
      return Promise.resolve(responses.total);
    },
  };

  require.cache[inventoryStockModelPath] = {
    id: inventoryStockModelPath,
    filename: inventoryStockModelPath,
    loaded: true,
    exports: modelMock,
  };

  return {
    repo: require("../../src/repositories/inventoryStock"),
    captured,
  };
};

test("inventory stock alert queries classify low stock, out of stock, and procurement required", async () => {
  const { repo, captured } = loadRepository({
    total: 3,
    items: [
      {
        _id: "stock-low",
        availableQuantity: 4,
        reorderLevel: 5,
        reorderQuantity: 3,
        productId: { name: "Laptop", sku: "LTP-1" },
      },
      {
        _id: "stock-out",
        availableQuantity: 0,
        reorderLevel: 5,
        reorderQuantity: 10,
        productId: { name: "Mouse", sku: "MSE-1" },
      },
      {
        _id: "stock-procurement",
        availableQuantity: 2,
        reorderLevel: 1,
        reorderQuantity: 3,
        productId: { name: "Keyboard", sku: "KEY-1" },
      },
    ],
  });

  const lowStock = await repo.findLowStock({ page: 1, limit: 10, spaceId: "space-1" });
  const outOfStock = await repo.findOutOfStock({ page: 1, limit: 10, spaceId: "space-1" });
  const procurementRequired = await repo.findProcurementRequired({ page: 1, limit: 10, spaceId: "space-1" });

  assert.equal(lowStock.items.find((item) => item._id === "stock-low").alertStatus, "LOW_STOCK");
  assert.equal(outOfStock.items.find((item) => item._id === "stock-out").alertStatus, "OUT_OF_STOCK");
  assert.equal(
    resolveInventoryStockAlertStatus({ availableQuantity: 2, reorderLevel: 1, reorderQuantity: 3 }),
    "PROCUREMENT_REQUIRED"
  );
  assert.ok(captured.some((item) => item.query?.spaceId === "space-1"));
});
