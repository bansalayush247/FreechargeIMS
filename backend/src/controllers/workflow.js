const workflowService = require("../services/workflow");

const asyncHandler = require("../utils/asyncHandler");

const {
  createWorkflowDefinitionSchema,
  updateWorkflowDefinitionSchema,
  getWorkflowDefinitionsSchema,
  startWorkflowSchema,
  transitionWorkflowSchema,
  getWorkflowInstancesSchema,
} = require("../validators/workflow");

// Handles get user id.
const getUserId = (req) => req.user._id || req.user.id;

// Handles get request context.
const getRequestContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent"),
});

// Handles create workflow definition.
const createWorkflowDefinition = asyncHandler(
  async (req, res) => {
    const { error, value } =
      createWorkflowDefinitionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const workflowDefinition =
      await workflowService.createWorkflowDefinition(
        req.headers["x-space-id"],
        value,
        getUserId(req),
        getRequestContext(req)
      );

    return res.status(201).json({
      success: true,
      message: "Workflow definition created successfully",
      data: workflowDefinition,
    });
  }
);

// Handles get workflow definitions.
const getWorkflowDefinitions = asyncHandler(async (req, res) => {
  const { error, value } =
    getWorkflowDefinitionsSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const workflowDefinitions =
    await workflowService.getWorkflowDefinitions(
      req.headers["x-space-id"],
      value
    );

  return res.status(200).json({
    success: true,
    message: "Workflow definitions fetched successfully",
    data: workflowDefinitions,
  });
});

// Handles get workflow definition by id.
const getWorkflowDefinitionById = asyncHandler(
  async (req, res) => {
    const workflowDefinition =
      await workflowService.getWorkflowDefinitionById(
        req.params.id,
        req.headers["x-space-id"]
      );

    return res.status(200).json({
      success: true,
      message: "Workflow definition fetched successfully",
      data: workflowDefinition,
    });
  }
);

// Handles update workflow definition.
const updateWorkflowDefinition = asyncHandler(
  async (req, res) => {
    const { error, value } =
      updateWorkflowDefinitionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const workflowDefinition =
      await workflowService.updateWorkflowDefinition(
        req.params.id,
        req.headers["x-space-id"],
        value,
        getUserId(req),
        getRequestContext(req)
      );

    return res.status(200).json({
      success: true,
      message: "Workflow definition updated successfully",
      data: workflowDefinition,
    });
  }
);

// Handles delete workflow definition.
const deleteWorkflowDefinition = asyncHandler(
  async (req, res) => {
    const workflowDefinition =
      await workflowService.deleteWorkflowDefinition(
        req.params.id,
        req.headers["x-space-id"],
        getUserId(req),
        getRequestContext(req)
      );

    return res.status(200).json({
      success: true,
      message: "Workflow definition deleted successfully",
      data: workflowDefinition,
    });
  }
);

// Handles start workflow.
const startWorkflow = asyncHandler(async (req, res) => {
  const { error, value } = startWorkflowSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const workflowInstance = await workflowService.startWorkflow(
    req.headers["x-space-id"],
    value,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(201).json({
    success: true,
    message: "Workflow started successfully",
    data: workflowInstance,
  });
});

// Handles transition workflow.
const transitionWorkflow = asyncHandler(async (req, res) => {
  const { error, value } =
    transitionWorkflowSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const workflowInstance =
    await workflowService.transitionWorkflow(
      req.params.id,
      req.headers["x-space-id"],
      value,
      getUserId(req),
      getRequestContext(req)
    );

  return res.status(200).json({
    success: true,
    message: "Workflow transitioned successfully",
    data: workflowInstance,
  });
});

// Handles get workflow instances.
const getWorkflowInstances = asyncHandler(async (req, res) => {
  const { error, value } =
    getWorkflowInstancesSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const workflowInstances =
    await workflowService.getWorkflowInstances(
      req.headers["x-space-id"],
      value
    );

  return res.status(200).json({
    success: true,
    message: "Workflow instances fetched successfully",
    data: workflowInstances,
  });
});

// Handles get workflow instance by id.
const getWorkflowInstanceById = asyncHandler(async (req, res) => {
  const workflowInstance =
    await workflowService.getWorkflowInstanceById(
      req.params.id,
      req.headers["x-space-id"]
    );

  return res.status(200).json({
    success: true,
    message: "Workflow instance fetched successfully",
    data: workflowInstance,
  });
});

module.exports = {
  createWorkflowDefinition,
  getWorkflowDefinitions,
  getWorkflowDefinitionById,
  updateWorkflowDefinition,
  deleteWorkflowDefinition,
  startWorkflow,
  transitionWorkflow,
  getWorkflowInstances,
  getWorkflowInstanceById,
};