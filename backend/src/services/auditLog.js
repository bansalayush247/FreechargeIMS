const auditLogRepository = require("../repositories/auditLog");

const AppError = require("../utils/appError");
const logger = require("../config/logger");

// Handles record audit log.
const recordAuditLog = async (payload, session) => {
  logger.info("Recording audit log", {
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId,
  });

  return auditLogRepository.create(
    {
      ...payload,
      createdBy: payload.actorId,
    },
    session
  );
};

// Handles get audit logs.
const getAuditLogs = async (filters) => {
  return auditLogRepository.paginate(filters);
};

// Handles get audit log by id.
const getAuditLogById = async (id) => {
  const auditLog = await auditLogRepository.findById(id);

  if (!auditLog) {
    throw new AppError("Audit log not found", 404);
  }

  return auditLog;
};

module.exports = {
  recordAuditLog,
  getAuditLogs,
  getAuditLogById,
};


