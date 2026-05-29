const auditLogService = require("../services/auditLog");

const asyncHandler = require("../utils/asyncHandler");

const { getAuditLogsSchema } = require("../validators/auditLog");

// Handles get audit logs.
const getAuditLogs = asyncHandler(async (req, res) => {
  const { error, value } =
    getAuditLogsSchema.validate({
      ...req.query,
      spaceId:
        req.query.spaceId ||
        req.headers["x-space-id"],
    });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const auditLogs = await auditLogService.getAuditLogs(
    value
  );

  return res.status(200).json({
    success: true,
    message: "Audit logs fetched successfully",
    data: auditLogs,
  });
});

// Handles get audit log by id.
const getAuditLogById = asyncHandler(async (req, res) => {
  const auditLog =
    await auditLogService.getAuditLogById(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Audit log fetched successfully",
    data: auditLog,
  });
});

module.exports = {
  getAuditLogs,
  getAuditLogById,
};
