const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const logger = require("../config/logger");
const AssetRequest = require("../models/assetRequest");
const WorkflowDefinition = require("../models/workflowDefinition");
const WorkflowInstance = require("../models/workflowInstance");
const {
  LEGACY_ASSET_REQUEST_STATUS_MAP,
} = require("../constants/assetRequest");

const STEP_KEY_MAP = {
  WAREHOUSE_FULFILLMENT: "FULFILLMENT",
  ZONAL_MANAGER_APPROVAL: "ZONAL_APPROVAL",
};

const WORKFLOW_STEPS_BY_CODE = {
  EMPLOYEE_ASSET_REQUEST: [
    { stepKey: "MANAGER_APPROVAL", name: "Manager Approval", order: 1, allowedActions: ["APPROVE", "REJECT"], nextStepKey: "IT_APPROVAL" },
    { stepKey: "IT_APPROVAL", name: "IT Approval", order: 2, allowedActions: ["APPROVE", "REJECT"], nextStepKey: "FULFILLMENT" },
    { stepKey: "FULFILLMENT", name: "Fulfillment", order: 3, allowedActions: ["COMPLETE", "REJECT"], nextStepKey: "" },
  ],
  MERCHANT_ASSET_REQUEST: [
    { stepKey: "MANAGER_APPROVAL", name: "Manager Approval", order: 1, allowedActions: ["APPROVE", "REJECT"], nextStepKey: "ZONAL_APPROVAL" },
    { stepKey: "ZONAL_APPROVAL", name: "Zonal Approval", order: 2, allowedActions: ["APPROVE", "REJECT"], nextStepKey: "FULFILLMENT" },
    { stepKey: "FULFILLMENT", name: "Fulfillment", order: 3, allowedActions: ["COMPLETE", "REJECT"], nextStepKey: "" },
  ],
};

async function migrateAssetRequestCanonicalStatuses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    let requestUpdates = 0;
    let definitionUpdates = 0;
    let workflowUpdates = 0;

    for (const [legacyStatus, canonicalStatus] of Object.entries(LEGACY_ASSET_REQUEST_STATUS_MAP)) {
      const result = await AssetRequest.updateMany(
        { status: legacyStatus },
        { $set: { status: canonicalStatus } }
      );
      requestUpdates += result.modifiedCount || 0;
    }

    for (const [legacyStep, canonicalStep] of Object.entries(STEP_KEY_MAP)) {
      const definitionResult = await WorkflowDefinition.updateMany(
        { "steps.stepKey": legacyStep },
        {
          $set: {
            "steps.$[step].stepKey": canonicalStep,
          },
        },
        {
          arrayFilters: [{ "step.stepKey": legacyStep }],
        }
      );
      definitionUpdates += definitionResult.modifiedCount || 0;

      const nextStepResult = await WorkflowDefinition.updateMany(
        { "steps.nextStepKey": legacyStep },
        {
          $set: {
            "steps.$[step].nextStepKey": canonicalStep,
          },
        },
        {
          arrayFilters: [{ "step.nextStepKey": legacyStep }],
        }
      );
      definitionUpdates += nextStepResult.modifiedCount || 0;

      const result = await WorkflowInstance.updateMany(
        { currentStepKey: legacyStep },
        { $set: { currentStepKey: canonicalStep } }
      );
      workflowUpdates += result.modifiedCount || 0;
    }

    for (const [code, steps] of Object.entries(WORKFLOW_STEPS_BY_CODE)) {
      const result = await WorkflowDefinition.updateMany(
        { code, isDeleted: false },
        { $set: { steps } }
      );
      definitionUpdates += result.modifiedCount || 0;
    }

    logger.info("Asset request canonical status migration completed", {
      requestUpdates,
      definitionUpdates,
      workflowUpdates,
    });

    process.exit(0);
  } catch (error) {
    logger.error("Asset request canonical status migration failed", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

migrateAssetRequestCanonicalStatuses();
