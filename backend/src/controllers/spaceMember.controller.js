const spaceMemberService = require(
  "../services/spaceMember.service"
);

const asyncHandler = require("../utils/asyncHandler");

const {
  addSpaceMemberSchema,
  updateSpaceMemberSchema,
  assignUserRoleSchema,
  getSpaceMembersSchema,
  getUserRolesSchema,
} = require("../validators/spaceMember.validation");

const getUserId = (req) => req.user._id || req.user.id;

const getRequestContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent"),
});

const addMember = asyncHandler(async (req, res) => {
  const { error, value } =
    addSpaceMemberSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const member = await spaceMemberService.addMember(
    req.spaceId,
    value,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(201).json({
    success: true,
    message: "Space member added successfully",
    data: member,
  });
});

const getMembers = asyncHandler(async (req, res) => {
  const { error, value } =
    getSpaceMembersSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const members = await spaceMemberService.getMembers(
    req.spaceId,
    value
  );

  return res.status(200).json({
    success: true,
    message: "Space members fetched successfully",
    data: members,
  });
});

const updateMember = asyncHandler(async (req, res) => {
  const { error, value } =
    updateSpaceMemberSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const member = await spaceMemberService.updateMember(
    req.params.id,
    req.spaceId,
    value,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(200).json({
    success: true,
    message: "Space member updated successfully",
    data: member,
  });
});

const removeMember = asyncHandler(async (req, res) => {
  const member = await spaceMemberService.removeMember(
    req.params.id,
    req.spaceId,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(200).json({
    success: true,
    message: "Space member removed successfully",
    data: member,
  });
});

const assignRole = asyncHandler(async (req, res) => {
  const { error, value } =
    assignUserRoleSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const assignment = await spaceMemberService.assignRole(
    req.spaceId,
    value,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(201).json({
    success: true,
    message: "Role assigned successfully",
    data: assignment,
  });
});

const getUserRoles = asyncHandler(async (req, res) => {
  const { error, value } =
    getUserRolesSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const assignments =
    await spaceMemberService.getUserRoles(
      req.spaceId,
      value
    );

  return res.status(200).json({
    success: true,
    message: "User roles fetched successfully",
    data: assignments,
  });
});

const removeRole = asyncHandler(async (req, res) => {
  const assignment = await spaceMemberService.removeRole(
    req.params.id,
    req.spaceId,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(200).json({
    success: true,
    message: "Role removed successfully",
    data: assignment,
  });
});

module.exports = {
  addMember,
  getMembers,
  updateMember,
  removeMember,
  assignRole,
  getUserRoles,
  removeRole,
};
