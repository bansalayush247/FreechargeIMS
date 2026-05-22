const mongoose = require("mongoose");

const {
  INVENTORY_TRANSACTION_TYPE_VALUES,
} = require("../constants/inventoryTransaction");

const inventoryTransactionSchema = new mongoose.Schema(
  {
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    fromWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null,
    },

    toWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null,
    },

    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    transactionType: {
      type: String,
      enum: INVENTORY_TRANSACTION_TYPE_VALUES,
      required: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    previousStatus: {
      type: String,
      required: true,
    },

    newStatus: {
      type: String,
      required: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    transactionDate: {
      type: Date,
      default: Date.now,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

inventoryTransactionSchema.index({ inventoryItemId: 1 });
inventoryTransactionSchema.index({ transactionType: 1 });
inventoryTransactionSchema.index({ performedBy: 1 });
inventoryTransactionSchema.index({ transactionDate: -1 });
inventoryTransactionSchema.index({
  inventoryItemId: 1,
  isDeleted: 1,
  transactionDate: 1,
});
inventoryTransactionSchema.index({
  transactionType: 1,
  isDeleted: 1,
  transactionDate: -1,
});
inventoryTransactionSchema.index({
  performedBy: 1,
  isDeleted: 1,
  transactionDate: -1,
});
inventoryTransactionSchema.index({
  fromWarehouseId: 1,
  isDeleted: 1,
  transactionDate: -1,
});
inventoryTransactionSchema.index({
  toWarehouseId: 1,
  isDeleted: 1,
  transactionDate: -1,
});

module.exports = mongoose.model(
  "InventoryTransaction",
  inventoryTransactionSchema
);

