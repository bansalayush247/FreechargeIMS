const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
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
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    permissions: [
      {
        type: String,
      },
    ],

    isSystemRole: {
      type: Boolean,
      default: false,
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

roleSchema.index(
  {
    spaceId: 1,
    code: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

roleSchema.index({ spaceId: 1, isActive: 1, isDeleted: 1 });
roleSchema.index({ spaceId: 1, isDeleted: 1, createdAt: -1 });

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;


