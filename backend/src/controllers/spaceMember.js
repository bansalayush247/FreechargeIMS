const spaceMemberService = require(
  "../services/spaceMember"
);

const asyncHandler = require("../utils/asyncHandler");

const {
  addSpaceMemberSchema,
  updateSpaceMemberSchema,
  assignUserRoleSchema,
  replaceUserRoleSchema,
  getSpaceMembersSchema,
  getUserRolesSchema,
} = require("../validators/spaceMember");

// Handles get user id.
const getUserId = (req) => req.user._id || req.user.id;

// Handles get request context.
const getRequestContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent"),
});

// Handles add member.
const addMember = asyncHandler(async (req, res) => {
  const { error, value } = addSpaceMemberSchema.validate(req.body);

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

// Handles get members.
const getMembers = asyncHandler(async (req, res) => {
  const { error, value } = getSpaceMembersSchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const members = await spaceMemberService.getMembers(req.spaceId, value);

  return res.status(200).json({
    success: true,
    message: "Space members fetched successfully",
    data: members,
  });
});

// Handles update member.
const updateMember = asyncHandler(async (req, res) => {
  const { error, value } = updateSpaceMemberSchema.validate(req.body);

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

// Handles remove member.
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

// Handles assign role.
const assignRole = asyncHandler(async (req, res) => {
  const { error, value } = assignUserRoleSchema.validate(req.body);

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

// Handles replace role.
const replaceRole = asyncHandler(async (req, res) => {
  const { error, value } = replaceUserRoleSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const result = await spaceMemberService.replaceRole(
    req.spaceId,
    value,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(200).json({
    success: true,
    message: "Role replaced successfully",
    data: result,
  });
});

// Handles get user roles.
const getUserRoles = asyncHandler(async (req, res) => {
  const { error, value } = getUserRolesSchema.validate(req.query);

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

// Handles remove role.
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
  replaceRole,
  getUserRoles,
  removeRole,
};
