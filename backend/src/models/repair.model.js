const mongoose = require("mongoose");

const {
  REPAIR_STATUS,
  REPAIR_PRIORITY,
  REPAIR_OUTCOME,
} = require("../constants/repair.constant");

const repairSchema = new mongoose.Schema(
  {
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },

    repairNumber: {
      type: String,
      required: true,
      trim: true,
    },

    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
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
      default: null,
      index: true,
    },

    assignedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    issueDescription: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: Object.values(REPAIR_PRIORITY),
      default: REPAIR_PRIORITY.MEDIUM,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(REPAIR_STATUS),
      default: REPAIR_STATUS.OPEN,
      index: true,
    },

    vendorName: {
      type: String,
      trim: true,
      default: "",
    },

    sentForRepairAt: {
      type: Date,
      default: null,
    },

    expectedReturnAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    outcome: {
      type: String,
      enum: Object.values(REPAIR_OUTCOME),
      default: null,
    },

    resolutionNotes: {
      type: String,
      trim: true,
      default: "",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

repairSchema.index(
  { repairNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

repairSchema.index({
  spaceId: 1,
  inventoryItemId: 1,
  status: 1,
  isDeleted: 1,
});
repairSchema.index({ spaceId: 1, status: 1, createdAt: -1 });
repairSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Repair", repairSchema);
