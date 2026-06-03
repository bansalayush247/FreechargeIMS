const mongoose = require("mongoose");

const {
  ASSET_REQUEST_STATUS,
  ASSET_REQUEST_STATUS_VALUES,
  ASSET_REQUEST_PRIORITY,
  ASSET_REQUEST_TYPE,
} = require("../constants/assetRequest");

const assetRequestSchema = new mongoose.Schema(
  {
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },

    requestNumber: {
      type: String,
      required: true,
      trim: true,
    },

    requestType: {
      type: String,
      enum: Object.values(ASSET_REQUEST_TYPE),
      required: true,
      index: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      default: null,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      default: null,
      index: true,
    },

    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    fulfilledQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    remainingQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    businessJustification: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: Object.values(ASSET_REQUEST_PRIORITY),
      default: ASSET_REQUEST_PRIORITY.MEDIUM,
      index: true,
    },

    status: {
      type: String,
      enum: ASSET_REQUEST_STATUS_VALUES,
      default: ASSET_REQUEST_STATUS.PENDING_MANAGER,
      index: true,
    },

    fulfilledAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
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

assetRequestSchema.index(
  { requestNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

assetRequestSchema.index({ spaceId: 1, requestType: 1, status: 1, isDeleted: 1, createdAt: -1 });
assetRequestSchema.index({ employeeId: 1, isDeleted: 1, createdAt: -1 });
assetRequestSchema.index({ merchantId: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model("AssetRequest", assetRequestSchema);
