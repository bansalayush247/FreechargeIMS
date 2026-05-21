const mongoose = require("mongoose");

const {
  WORKFLOW_ENTITY_TYPES,
  WORKFLOW_STATUS,
  WORKFLOW_ACTIONS,
} = require("../constants/workflow");

const workflowHistorySchema = new mongoose.Schema(
  {
    stepKey: {
      type: String,
      required: true,
      trim: true,
    },

    action: {
      type: String,
      enum: Object.values(WORKFLOW_ACTIONS),
      required: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    performedAt: {
      type: Date,
      default: Date.now,
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

const workflowInstanceSchema = new mongoose.Schema(
  {
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },

    workflowDefinitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkflowDefinition",
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      enum: Object.values(WORKFLOW_ENTITY_TYPES),
      required: true,
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(WORKFLOW_STATUS),
      default: WORKFLOW_STATUS.ACTIVE,
      index: true,
    },

    currentStepKey: {
      type: String,
      required: true,
      trim: true,
    },

    history: {
      type: [workflowHistorySchema],
      default: [],
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    completedAt: {
      type: Date,
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

workflowInstanceSchema.index({
  spaceId: 1,
  entityType: 1,
  entityId: 1,
  status: 1,
});

module.exports = mongoose.model(
  "WorkflowInstance",
  workflowInstanceSchema
);