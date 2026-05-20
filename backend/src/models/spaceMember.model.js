const mongoose = require("mongoose");

const spaceMemberSchema = new mongoose.Schema(
  {
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    joinedAt: {
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

spaceMemberSchema.index(
  {
    spaceId: 1,
    userId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

spaceMemberSchema.index({ spaceId: 1, isActive: 1, isDeleted: 1 });

const SpaceMember = mongoose.model("SpaceMember", spaceMemberSchema);

module.exports = SpaceMember;
