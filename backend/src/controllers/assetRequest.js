const assetRequestService = require("../services/assetRequest");
const userRoleRepository = require("../repositories/userRole");
const roleRepository = require("../repositories/role");
const asyncHandler = require("../utils/asyncHandler");

const {
  createAssetRequestSchema,
  approveRequestSchema,
  fulfillRequestSchema,
  rejectionSchema,
  forwardSchema,
  getAssetRequestsSchema,
} = require("../validators/assetRequest");
const { USER_TYPES } = require("../constants/user");

const getRequestPermissions = async (req, userId, spaceId) => {
  if (req.user?.userType === USER_TYPES.ADMIN) return req.permissions || [];
  if (Array.isArray(req.permissions) && req.permissions.length) return req.permissions;

  const userRoles = await userRoleRepository.findUserRolesByUserAndSpace(userId, spaceId);
  const roles = await roleRepository.findActiveRolesByIds(userRoles.map((item) => item.roleId));
  return [...new Set(roles.flatMap((role) => role.permissions || []))];
};

const createAssetRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } = createAssetRequestSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const request = await assetRequestService.createAssetRequest(value, userId, {
    spaceId: req.spaceId,
    userType: req.user?.userType,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return res.status(201).json({ success: true, message: "Asset request created successfully", data: request });
});

const getAssetRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } = getAssetRequestsSchema.validate({ ...req.query, spaceId: req.spaceId });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const permissions = await getRequestPermissions(req, userId, req.spaceId);
  const requests = await assetRequestService.getAssetRequests(value, { userId, userType: req.user?.userType, permissions });
  return res.status(200).json({ success: true, message: "Asset requests fetched successfully", data: requests });
});

const getAssetRequestById = asyncHandler(async (req, res) => {
  const request = await assetRequestService.getAssetRequestById(req.params.id, { spaceId: req.spaceId });
  return res.status(200).json({ success: true, message: "Asset request fetched successfully", data: request });
});

const approveRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } = approveRequestSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const request = await assetRequestService.approveRequest(req.params.id, value, userId, {
    spaceId: req.spaceId,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return res.status(200).json({ success: true, message: "Asset request approved", data: request });
});

const fulfillRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } = fulfillRequestSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const request = await assetRequestService.fulfillRequest(req.params.id, value, userId, {
    spaceId: req.spaceId,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return res.status(200).json({ success: true, message: "Asset request fulfilled", data: request });
});

const managerApproveRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } = approveRequestSchema.validate({ ...req.body, stepKey: "MANAGER_APPROVAL" });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const request = await assetRequestService.managerApproveRequest(req.params.id, value, userId);
  return res.status(200).json({ success: true, message: "Manager approval completed", data: request });
});

const itApproveRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } = approveRequestSchema.validate({ ...req.body, stepKey: "IT_APPROVAL" });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const request = await assetRequestService.itApproveRequest(req.params.id, value, userId);
  return res.status(200).json({ success: true, message: "IT approval completed", data: request });
});

const rejectRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } = rejectionSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const request = await assetRequestService.rejectRequest(req.params.id, value, userId);
  return res.status(200).json({ success: true, message: "Asset request rejected", data: request });
});

const cancelRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const request = await assetRequestService.cancelRequest(req.params.id, userId);
  return res.status(200).json({ success: true, message: "Asset request cancelled", data: request });
});

const forwardRequest = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } = forwardSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const request = await assetRequestService.forwardRequest(req.params.id, value, userId);
  return res.status(200).json({ success: true, message: "Asset request forwarded", data: request });
});

module.exports = {
  createAssetRequest,
  getAssetRequests,
  getAssetRequestById,
  approveRequest,
  fulfillRequest,
  managerApproveRequest,
  itApproveRequest,
  rejectRequest,
  cancelRequest,
  forwardRequest,
};
