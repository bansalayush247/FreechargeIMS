const mongoose = require("mongoose");

const ASSET_REGISTRY_STATUS = {
  ASSIGNED: "ASSIGNED",
  RETURNED: "RETURNED",
  LOST: "LOST",
  DAMAGED: "DAMAGED",
  RETIRED: "RETIRED",
  TRANSFERRED: "TRANSFERRED",
  REVOKED: "REVOKED",
};

const assetRegistrySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    assignedToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    assignedToMerchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      default: null,
      index: true,
    },
    assignedSpaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },
    assignedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetRequest",
      default: null,
      index: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    sourceInventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ASSET_REGISTRY_STATUS),
      default: ASSET_REGISTRY_STATUS.ASSIGNED,
      index: true,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    returnedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

assetRegistrySchema.path("assignedToMerchantId").validate(function validateExclusiveAssignee(value) {
  if (!this.assignedToUserId && !value) return false;
  return !(this.assignedToUserId && value);
}, "Exactly one assignee must be provided.");

module.exports = {
  AssetRegistry: mongoose.model("AssetRegistry", assetRegistrySchema),
  ASSET_REGISTRY_STATUS,
};
