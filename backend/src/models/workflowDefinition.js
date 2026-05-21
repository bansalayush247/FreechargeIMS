const mongoose = require("mongoose");

const {
  WORKFLOW_ENTITY_TYPES,
} = require("../constants/workflow");

const workflowStepSchema = new mongoose.Schema(
  {
    stepKey: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    allowedActions: [
      {
        type: String,
        trim: true,
      },
    ],

    approverRoleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],

    nextStepKey: {
      type: String,
      trim: true,
      default: "",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    _id: false,
  }
);

const workflowDefinitionSchema = new mongoose.Schema(
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

    entityType: {
      type: String,
      enum: Object.values(WORKFLOW_ENTITY_TYPES),
      required: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    steps: {
      type: [workflowStepSchema],
      default: [],
      validate: {
        validator(steps) {
          return steps.length > 0;
        },
        message: "Workflow must have at least one step",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

workflowDefinitionSchema.index(
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

module.exports = mongoose.model(
  "WorkflowDefinition",
  workflowDefinitionSchema
);