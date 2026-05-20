const mongoose = require("mongoose");

const {
  INVENTORY_STATUS,
  INVENTORY_CONDITION,
} = require("../constants/inventory.constant");

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    assignedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    serialNumber: {
      type: String,
      required: true,
      trim: true,
    },

    assetTag: {
      type: String,
      required: true,
      trim: true,
    },

    qrCode: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(INVENTORY_STATUS),
      default: INVENTORY_STATUS.AVAILABLE,
    },

    purchaseDate: {
      type: Date,
      default: null,
    },

    warrantyExpiry: {
      type: Date,
      default: null,
    },

    condition: {
      type: String,
      enum: Object.values(INVENTORY_CONDITION),
      default: INVENTORY_CONDITION.GOOD,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
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

inventorySchema.index(
  { serialNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

inventorySchema.index(
  { assetTag: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

inventorySchema.index(
  { qrCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

inventorySchema.index({ productId: 1 });
inventorySchema.index({ warehouseId: 1 });
inventorySchema.index({ status: 1 });

module.exports = mongoose.model("InventoryItem", inventorySchema);