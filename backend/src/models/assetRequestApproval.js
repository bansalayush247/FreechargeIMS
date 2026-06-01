const mongoose = require("mongoose");

const {
  ASSET_REQUEST_STEP_KEYS,
  ASSET_REQUEST_APPROVAL_ACTIONS,
} = require("../constants/assetRequest");

const assetRequestApprovalSchema = new mongoose.Schema(
  {
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },

    assetRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetRequest",
      required: true,
      index: true,
    },

    stepKey: {
      type: String,
      enum: Object.values(ASSET_REQUEST_STEP_KEYS),
      required: true,
      index: true,
    },

    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: Object.values(ASSET_REQUEST_APPROVAL_ACTIONS),
      required: true,
      index: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    actionAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

assetRequestApprovalSchema.index({ assetRequestId: 1, actionAt: -1 });

module.exports = mongoose.model("AssetRequestApproval", assetRequestApprovalSchema);
