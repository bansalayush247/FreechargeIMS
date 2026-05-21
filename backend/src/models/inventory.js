const mongoose = require("mongoose");

const {
  INVENTORY_STATUS,
  INVENTORY_STATUS_VALUES,
  INVENTORY_CONDITION,
} = require("../constants/inventory");

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

    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },

    serialNumber: {
      type: String,
      trim: true,
      default: null,
    },

    assetTag: {
      type: String,
      trim: true,
      default: null,
    },

    qrCode: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: INVENTORY_STATUS_VALUES,
      default: INVENTORY_STATUS.IN_STOCK,
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
      serialNumber: {
        $type: "string",
      },
      isDeleted: false,
    },
  }
);

inventorySchema.index(
  { assetTag: 1 },
  {
    unique: true,
    partialFilterExpression: {
      assetTag: {
        $type: "string",
      },
      isDeleted: false,
    },
  }
);

inventorySchema.index(
  { qrCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      qrCode: {
        $type: "string",
      },
      isDeleted: false,
    },
  }
);

inventorySchema.index({ productId: 1 });
inventorySchema.index({ warehouseId: 1 });
inventorySchema.index({ status: 1 });

module.exports = mongoose.model("InventoryItem", inventorySchema);

