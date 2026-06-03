const logger = require("../config/logger");
const roleService = require("../services/role");

const asyncHandler = require("../utils/asyncHandler");

const {
  createRoleSchema,
  updateRoleSchema,
  getRolesSchema,
} = require("../validators/role");

// Handles get user id.
const getUserId = (req) => req.user._id || req.user.id;

// Handles get request context.
const getRequestContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent"),
});

// Handles create role.
const createRole = asyncHandler(async (req, res) => {
  const { error, value } = createRoleSchema.validate(
    req.body
  );

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  const role = await roleService.createRole(
    req.spaceId,
    value,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(201).json({
    success: true,
    message: "Role created successfully",
    data: role,
  });
});

// Handles get roles.
const getRoles = asyncHandler(async (req, res) => {
  const { error, value } = getRolesSchema.validate(
    req.query
  );

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const roles = await roleService.getRoles(
    req.spaceId,
    value
  );

  return res.status(200).json({
    success: true,
    message: "Roles fetched successfully",
    data: roles,
  });
});

// Handles get role by id.
const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(
    req.params.id,
    req.spaceId
  );

  return res.status(200).json({
    success: true,
    message: "Role fetched successfully",
    data: role,
  });
});

// Handles update role.
const updateRole = asyncHandler(async (req, res) => {
  const { error, value } = updateRoleSchema.validate(
    req.body
  );

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const role = await roleService.updateRole(
    req.params.id,
    req.spaceId,
    value,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(200).json({
    success: true,
    message: "Role updated successfully",
    data: role,
  });
});

// Handles delete role.
const deleteRole = asyncHandler(async (req, res) => {
  const role = await roleService.deleteRole(
    req.params.id,
    req.spaceId,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(200).json({
    success: true,
    message: "Role deleted successfully",
    data: role,
  });
});

module.exports = {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
};


