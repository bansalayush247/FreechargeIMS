const mongoose = require("mongoose");

const {
  INVENTORY_STATUS,
  INVENTORY_STATUS_VALUES,
  INVENTORY_CONDITION,
} = require("../constants/inventory");

const inventorySchema = new mongoose.Schema(
  {
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },

    assignedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    assignedMerchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      default: null,
      index: true,
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
      immutable: true,
    },

    status: {
      type: String,
      enum: INVENTORY_STATUS_VALUES,
      default: INVENTORY_STATUS.AVAILABLE,
      index: true,
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

inventorySchema.path("assignedMerchantId").validate(function validateExclusiveAssignment(value) {
  if (!this.assignedUserId && !value) {
    return true;
  }

  return !(this.assignedUserId && value);
}, "Only one of assignedUserId or assignedMerchantId can be populated.");

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

inventorySchema.index({ spaceId: 1, productId: 1, status: 1, isDeleted: 1, createdAt: -1 });
inventorySchema.index({ warehouseId: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model("InventoryItem", inventorySchema);
