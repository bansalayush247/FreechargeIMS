const express = require("express");

const router = express.Router();

const workflowController = require("../controllers/workflow");

const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const {
  WORKFLOW_PERMISSIONS,
} = require("../constants/workflow");

const ROUTES = require("../constants/routes");

router.post(
  ROUTES.WORKFLOW_ROUTES.DEFINITIONS,
  authMiddleware,
  authorize(WORKFLOW_PERMISSIONS.CREATE_WORKFLOW),
  workflowController.createWorkflowDefinition
);

router.get(
  ROUTES.WORKFLOW_ROUTES.DEFINITIONS,
  authMiddleware,
  authorize(WORKFLOW_PERMISSIONS.VIEW_WORKFLOW),
  workflowController.getWorkflowDefinitions
);

router.get(
  ROUTES.WORKFLOW_ROUTES.DEFINITION_BY_ID,
  authMiddleware,
  authorize(WORKFLOW_PERMISSIONS.VIEW_WORKFLOW),
  workflowController.getWorkflowDefinitionById
);

router.patch(
  ROUTES.WORKFLOW_ROUTES.DEFINITION_BY_ID,
  authMiddleware,
  authorize(WORKFLOW_PERMISSIONS.UPDATE_WORKFLOW),
  workflowController.updateWorkflowDefinition
);

router.delete(
  ROUTES.WORKFLOW_ROUTES.DEFINITION_BY_ID,
  authMiddleware,
  authorize(WORKFLOW_PERMISSIONS.DELETE_WORKFLOW),
  workflowController.deleteWorkflowDefinition
);

router.post(
  ROUTES.WORKFLOW_ROUTES.INSTANCES,
  authMiddleware,
  authorize(WORKFLOW_PERMISSIONS.EXECUTE_WORKFLOW),
  workflowController.startWorkflow
);

router.get(
  ROUTES.WORKFLOW_ROUTES.INSTANCES,
  authMiddleware,
  authorize(WORKFLOW_PERMISSIONS.VIEW_WORKFLOW),
  workflowController.getWorkflowInstances
);

router.get(
  ROUTES.WORKFLOW_ROUTES.INSTANCE_BY_ID,
  authMiddleware,
  authorize(WORKFLOW_PERMISSIONS.VIEW_WORKFLOW),
  workflowController.getWorkflowInstanceById
);

router.patch(
  ROUTES.WORKFLOW_ROUTES.INSTANCE_TRANSITION,
  authMiddleware,
  authorize(WORKFLOW_PERMISSIONS.EXECUTE_WORKFLOW),
  workflowController.transitionWorkflow
);

module.exports = router;