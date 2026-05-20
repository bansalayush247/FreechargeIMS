const mongoose = require("mongoose");

const {
  WAREHOUSE_TYPES,
} = require("../constants/warehouse.constant");

const warehouseSchema = new mongoose.Schema(
  {
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    type: {
      type: String,
      enum: Object.values(WAREHOUSE_TYPES),
      required: true,
    },

    address: {
      line1: {
        type: String,
        trim: true,
      },

      city: {
        type: String,
        trim: true,
      },

      state: {
        type: String,
        trim: true,
      },

      pincode: {
        type: String,
        trim: true,
      },
    },

    managerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
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
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

warehouseSchema.index(
  {
    spaceId: 1,
    code: 1,
  },
  {
    unique: true,
  }
);

warehouseSchema.index({
  spaceId: 1,
  type: 1,
});

module.exports = mongoose.model(
  "Warehouse",
  warehouseSchema
);