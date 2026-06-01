const inventoryTransactionService = require("../services/inventoryTransaction");

const asyncHandler = require("../utils/asyncHandler");

const {
  createTransactionSchema,
  getTransactionsSchema,
} = require("../validators/inventoryTransaction");

// Handles create transaction.
const createTransaction = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  // Accept alias fields for migration: map storageLocationId -> warehouseId
  if (!req.body.fromWarehouseId && req.body.fromStorageLocationId) {
    req.body.fromWarehouseId = req.body.fromStorageLocationId;
  }
  if (!req.body.toWarehouseId && req.body.toStorageLocationId) {
    req.body.toWarehouseId = req.body.toStorageLocationId;
  }

  const { error, value } =
    createTransactionSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const transaction =
    await inventoryTransactionService.createTransaction(
      value,
      userId,
      {
        spaceId: req.spaceId,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

  return res.status(201).json({
    success: true,
    message: "Transaction created successfully",
    data: transaction,
  });
});

// Handles get transactions.
const getTransactions = asyncHandler(async (req, res) => {
  // Accept storageLocationId alias in query params
  if (!req.query.warehouseId && req.query.storageLocationId) {
    req.query.warehouseId = req.query.storageLocationId;
  }

  const { error, value } =
    getTransactionsSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const transactions =
    await inventoryTransactionService.getTransactions(
      { ...value, spaceId: req.spaceId }
    );

  return res.status(200).json({
    success: true,
    message: "Transactions fetched successfully",
    data: transactions,
  });
});

// Handles get transaction by id.
const getTransactionById = asyncHandler(async (req, res) => {
  const transaction =
    await inventoryTransactionService.getTransactionById(
      req.params.id,
      { spaceId: req.spaceId }
    );

  return res.status(200).json({
    success: true,
    message: "Transaction fetched successfully",
    data: transaction,
  });
});

// Handles get item audit trail.
const getItemAuditTrail = asyncHandler(async (req, res) => {
  const transactions =
    await inventoryTransactionService.getItemAuditTrail(
      req.params.inventoryItemId,
      {
        spaceId: req.spaceId,
        userId: req.user._id || req.user.id,
        userType: req.user.userType,
      }
    );

  return res.status(200).json({
    success: true,
    message: "Audit trail fetched successfully",
    data: transactions,
  });
});

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  getItemAuditTrail,
};
