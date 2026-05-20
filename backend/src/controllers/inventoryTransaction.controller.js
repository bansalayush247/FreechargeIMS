const inventoryTransactionService = require(
  "../services/inventoryTransaction.service"
);

const asyncHandler = require("../utils/asyncHandler");

const {
  createTransactionSchema,
  getTransactionsSchema,
} = require("../validators/inventoryTransaction.validation");

const createTransaction = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
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
        spaceId: req.headers["x-space-id"],
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

const getTransactions = asyncHandler(async (req, res) => {
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
      value
    );

  return res.status(200).json({
    success: true,
    message: "Transactions fetched successfully",
    data: transactions,
  });
});

const getTransactionById = asyncHandler(async (req, res) => {
  const transaction =
    await inventoryTransactionService.getTransactionById(
      req.params.id
    );

  return res.status(200).json({
    success: true,
    message: "Transaction fetched successfully",
    data: transaction,
  });
});

const getItemAuditTrail = asyncHandler(async (req, res) => {
  const transactions =
    await inventoryTransactionService.getItemAuditTrail(
      req.params.inventoryItemId
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
