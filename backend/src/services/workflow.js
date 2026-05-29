const workflowDefinitionRepository = require("../repositories/workflowDefinition");
const workflowInstanceRepository = require("../repositories/workflowInstance");
const auditLogService = require("./auditLog");

const AppError = require("../utils/appError");
const logger = require("../config/logger");

const {
  WORKFLOW_STATUS,
  WORKFLOW_ACTIONS,
} = require("../constants/workflow");
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} = require("../constants/auditLog");

// Handles sorting workflow steps.
const sortSteps = (steps) => {
  return [...steps].sort((a, b) => a.order - b.order);
};

// Handles validating workflow steps.
const validateWorkflowSteps = (steps) => {
  const stepKeys = new Set();

  for (const step of steps) {
    if (stepKeys.has(step.stepKey)) {
      throw new AppError("Workflow step keys must be unique", 400);
    }

    stepKeys.add(step.stepKey);
  }

  for (const step of steps) {
    if (step.nextStepKey && !stepKeys.has(step.nextStepKey)) {
      throw new AppError(
        `Next step ${step.nextStepKey} does not exist`,
        400
      );
    }
  }
};

// Handles create workflow definition.
const createWorkflowDefinition = async (
  spaceId,
  payload,
  userId,
  context = {}
) => {
  validateWorkflowSteps(payload.steps);

  const existingWorkflow =
    await workflowDefinitionRepository.findByCode(
      spaceId,
      payload.code
    );

  if (existingWorkflow) {
    throw new AppError("Workflow code already exists", 400);
  }

  const workflowDefinition =
    await workflowDefinitionRepository.create({
      ...payload,
      spaceId,
      steps: sortSteps(payload.steps),
      createdBy: userId,
      updatedBy: userId,
    });

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITY_TYPES.WORKFLOW_DEFINITION,
    entityId: workflowDefinition._id,
    before: null,
    after: workflowDefinition,
    metadata: { code: workflowDefinition.code },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  logger.info("Workflow definition created", {
    workflowDefinitionId: workflowDefinition._id,
  });

  return workflowDefinition;
};

// Handles get workflow definitions.
const getWorkflowDefinitions = async (spaceId, filters) => {
  return workflowDefinitionRepository.paginate({
    ...filters,
    spaceId,
  });
};

// Handles get workflow definition by id.
const getWorkflowDefinitionById = async (id, spaceId) => {
  const workflowDefinition =
    await workflowDefinitionRepository.findById(id);

  if (
    !workflowDefinition ||
    String(workflowDefinition.spaceId) !== String(spaceId)
  ) {
    throw new AppError("Workflow definition not found", 404);
  }

  return workflowDefinition;
};

// Handles update workflow definition.
const updateWorkflowDefinition = async (
  id,
  spaceId,
  payload,
  userId,
  context = {}
) => {
  const workflowDefinition = await getWorkflowDefinitionById(
    id,
    spaceId
  );

  if (payload.steps) {
    validateWorkflowSteps(payload.steps);
    payload.steps = sortSteps(payload.steps);
  }

  const updatedWorkflowDefinition =
    await workflowDefinitionRepository.updateById(id, {
      ...payload,
      updatedBy: userId,
    });

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: AUDIT_ENTITY_TYPES.WORKFLOW_DEFINITION,
    entityId: id,
    before: workflowDefinition,
    after: updatedWorkflowDefinition,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return updatedWorkflowDefinition;
};

// Handles delete workflow definition.
const deleteWorkflowDefinition = async (
  id,
  spaceId,
  userId,
  context = {}
) => {
  const workflowDefinition = await getWorkflowDefinitionById(
    id,
    spaceId
  );

  const deletedWorkflowDefinition =
    await workflowDefinitionRepository.updateById(id, {
      isActive: false,
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      updatedBy: userId,
    });

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.DELETE,
    entityType: AUDIT_ENTITY_TYPES.WORKFLOW_DEFINITION,
    entityId: id,
    before: workflowDefinition,
    after: deletedWorkflowDefinition,
    metadata: {},
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return deletedWorkflowDefinition;
};

// Handles start workflow instance.
const startWorkflow = async (
  spaceId,
  payload,
  userId,
  context = {}
) => {
  const workflowDefinition = await getWorkflowDefinitionById(
    payload.workflowDefinitionId,
    spaceId
  );

  if (!workflowDefinition.isActive) {
    throw new AppError("Workflow definition is inactive", 400);
  }

  if (workflowDefinition.entityType !== payload.entityType) {
    throw new AppError(
      "Workflow definition entity type does not match",
      400
    );
  }

  const activeInstance =
    await workflowInstanceRepository.findActiveByEntity(
      spaceId,
      payload.entityType,
      payload.entityId
    );

  if (activeInstance) {
    throw new AppError(
      "Entity already has an active workflow instance",
      400
    );
  }

  const firstStep = sortSteps(workflowDefinition.steps)[0];

  const workflowInstance = await workflowInstanceRepository.create({
    spaceId,
    workflowDefinitionId: workflowDefinition._id,
    entityType: payload.entityType,
    entityId: payload.entityId,
    status: WORKFLOW_STATUS.ACTIVE,
    currentStepKey: firstStep.stepKey,
    metadata: payload.metadata || {},
    startedBy: userId,
    createdBy: userId,
    updatedBy: userId,
  });

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: AUDIT_ENTITY_TYPES.WORKFLOW_INSTANCE,
    entityId: workflowInstance._id,
    before: null,
    after: workflowInstance,
    metadata: { entityType: payload.entityType, entityId: payload.entityId },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return workflowInstance;
};

// Handles transition workflow instance.
const transitionWorkflow = async (
  id,
  spaceId,
  payload,
  userId,
  context = {}
) => {
  const workflowInstance =
    await workflowInstanceRepository.findById(id);

  if (
    !workflowInstance ||
    String(workflowInstance.spaceId) !== String(spaceId)
  ) {
    throw new AppError("Workflow instance not found", 404);
  }

  if (workflowInstance.status !== WORKFLOW_STATUS.ACTIVE) {
    throw new AppError("Workflow instance is not active", 400);
  }

  const workflowDefinition = workflowInstance.workflowDefinitionId;
  const currentStep = workflowDefinition.steps.find(
    (step) => step.stepKey === workflowInstance.currentStepKey
  );

  if (!currentStep) {
    throw new AppError("Current workflow step not found", 400);
  }

  if (!currentStep.allowedActions.includes(payload.action)) {
    throw new AppError("Action is not allowed for current step", 400);
  }

  let nextStepKey = payload.nextStepKey || currentStep.nextStepKey;
  let status = WORKFLOW_STATUS.ACTIVE;
  let completedAt = workflowInstance.completedAt;

  if (
    [WORKFLOW_ACTIONS.COMPLETE, WORKFLOW_ACTIONS.APPROVE].includes(
      payload.action
    ) &&
    !nextStepKey
  ) {
    status = WORKFLOW_STATUS.COMPLETED;
    completedAt = new Date();
  }

  if (
    [WORKFLOW_ACTIONS.CANCEL, WORKFLOW_ACTIONS.REJECT].includes(
      payload.action
    )
  ) {
    status = WORKFLOW_STATUS.CANCELLED;
    completedAt = new Date();
    nextStepKey = workflowInstance.currentStepKey;
  }

  if (nextStepKey) {
    const nextStep = workflowDefinition.steps.find(
      (step) => step.stepKey === nextStepKey
    );

    if (!nextStep) {
      throw new AppError("Next workflow step not found", 400);
    }
  }

  const history = [
    ...workflowInstance.history,
    {
      stepKey: workflowInstance.currentStepKey,
      action: payload.action,
      remarks: payload.remarks || "",
      performedBy: userId,
      performedAt: new Date(),
      metadata: payload.metadata || {},
    },
  ];

  const updatedWorkflowInstance =
    await workflowInstanceRepository.updateById(id, {
      status,
      currentStepKey: nextStepKey || workflowInstance.currentStepKey,
      completedAt,
      history,
      updatedBy: userId,
    });

  await auditLogService.recordAuditLog({
    spaceId,
    actorId: userId,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: AUDIT_ENTITY_TYPES.WORKFLOW_INSTANCE,
    entityId: id,
    before: workflowInstance,
    after: updatedWorkflowInstance,
    metadata: { workflowAction: payload.action },
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
  });

  return updatedWorkflowInstance;
};

// Handles get workflow instances.
const getWorkflowInstances = async (spaceId, filters) => {
  return workflowInstanceRepository.paginate({
    ...filters,
    spaceId,
  });
};

// Handles get workflow instance by id.
const getWorkflowInstanceById = async (id, spaceId) => {
  const workflowInstance =
    await workflowInstanceRepository.findById(id);

  if (
    !workflowInstance ||
    String(workflowInstance.spaceId) !== String(spaceId)
  ) {
    throw new AppError("Workflow instance not found", 404);
  }

  return workflowInstance;
};

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