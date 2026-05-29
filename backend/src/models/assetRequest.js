const mongoose = require("mongoose");

const { ASSET_REQUEST_STATUS, ASSET_REQUEST_PRIORITY } = require("../constants/assetRequest");

const assetRequestSchema = new mongoose.Schema(
  {
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },

    originSpaceId: {
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

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    },

    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    businessJustification: {
      type: String,
      required: true,
      trim: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    priority: {
      type: String,
      enum: Object.values(ASSET_REQUEST_PRIORITY),
      default: ASSET_REQUEST_PRIORITY.MEDIUM,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(ASSET_REQUEST_STATUS),
      default: ASSET_REQUEST_STATUS.PENDING,
      index: true,
    },

    managerApprovalBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    managerApprovalAt: {
      type: Date,
      default: null,
    },

    managerRemarks: {
      type: String,
      trim: true,
      default: "",
    },

    itApprovalBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    itApprovalAt: {
      type: Date,
      default: null,
    },

    itRemarks: {
      type: String,
      trim: true,
      default: "",
    },

    approvedAt: {
      type: Date,
      default: null,
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

    forwardedFromSpaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      default: null,
    },

    forwardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    forwardedAt: {
      type: Date,
      default: null,
    },

    forwardedHistory: {
      type: [
        {
          fromSpaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Space",
          },
          toSpaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Space",
          },
          forwardedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          forwardedAt: {
            type: Date,
          },
        },
      ],
      default: [],
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

assetRequestSchema.index({ isDeleted: 1, createdAt: -1 });
assetRequestSchema.index({ spaceId: 1, isDeleted: 1, createdAt: -1 });
assetRequestSchema.index({
  employeeId: 1,
  isDeleted: 1,
  createdAt: -1,
});
assetRequestSchema.index({
  productId: 1,
  isDeleted: 1,
  createdAt: -1,
});
assetRequestSchema.index({
  status: 1,
  priority: 1,
  isDeleted: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "AssetRequest",
  assetRequestSchema
);

