const roleRepository = require("../repositories/role");
const spaceRepository = require("../repositories/space");
const userRoleRepository = require("../repositories/userRole");
const auditLogService = require("./auditLog");
const AppError = require("../utils/appError");
const logger = require("../config/logger");
const { getEnforcer } = require("../config/casbin"); // 🟢 Added

const assertSpaceExists = async (spaceId) => {
  const space = await spaceRepository.findById(spaceId);
  if (!space || !space.isActive) throw new AppError("Space not found or inactive", 404);
  return space;
};

const createRole = async (spaceId, payload, userId, context = {}) => {
  await assertSpaceExists(spaceId);
  const existingRole = await roleRepository.findBySpaceAndCode(spaceId, payload.code);
  if (existingRole) throw new AppError("Role code already exists", 400);

  const role = await roleRepository.create({
    ...payload,
    spaceId,
    isSystemRole: false,
    createdBy: userId,
    updatedBy: userId,
  });

  //Intercept write: Inject definitions directly to Casbin engine
  const enforcer = await getEnforcer();
  const roleSubject = `${String(role.code)}:${String(spaceId)}`;
  
  for (const permissionString of role.permissions || []) {
    const [resource, action] = permissionString.split(":");
    if (resource && action) {
      await enforcer.addPolicy(roleSubject, resource, action);
    }
  }
  await enforcer.savePolicy();

  return role;
};

const updateRole = async (id, spaceId, payload, userId, context = {}) => {
  const role = await roleRepository.findById(id);
  if (!role || String(role.spaceId) !== String(spaceId)) throw new AppError("Role not found", 404);
  if (role.isSystemRole && payload.permissions) throw new AppError("System role permissions cannot be updated", 400);

  const updatedRole = await roleRepository.updateById(id, { ...payload, updatedBy: userId });

  //Intercept update: Sync modified access mappings to adapter storage
  if (payload.permissions) {
    const enforcer = await getEnforcer();
    const roleSubject = `${String(role.code)}:${String(spaceId)}`;
    
    // Wipe old tracking configurations, write fresh array blocks
    await enforcer.removeFilteredPolicy("p", "p", 0, roleSubject);
    for (const permissionString of updatedRole.permissions || []) {
      const [resource, action] = permissionString.split(":");
      if (resource && action) {
        await enforcer.addPolicy(roleSubject, resource, action);
      }
    }
    await enforcer.savePolicy();
  }

  return updatedRole;
};

const getRoles = async (spaceId, filters = {}) => {
  await assertSpaceExists(spaceId);

  return roleRepository.paginate({
    ...filters,
    spaceId,
  });
};

const getRoleById = async (id, spaceId) => {
  await assertSpaceExists(spaceId);
  const role = await roleRepository.findById(id);
  if (!role || String(role.spaceId) !== String(spaceId)) throw new AppError("Role not found", 404);
  return role;
};

const deleteRole = async (id, spaceId, userId, context = {}) => {
  const role = await roleRepository.findById(id);
  if (!role || String(role.spaceId) !== String(spaceId)) throw new AppError("Role not found", 404);
  if (role.isSystemRole) throw new AppError("System role cannot be deleted", 400);

  const deletePayload = { isActive: false, isDeleted: true, deletedAt: new Date(), deletedBy: userId, updatedBy: userId };
  const deletedRole = await roleRepository.updateById(id, deletePayload);
  await userRoleRepository.softDeleteByRoleAndSpace(id, spaceId, deletePayload);

  //Intercept deletion: Purge stale permission sets from active evaluation bounds
  const enforcer = await getEnforcer();
  const roleSubject = `${String(role.code)}:${String(spaceId)}`;
  await enforcer.removeFilteredPolicy("p", "p", 0, roleSubject);
  await enforcer.savePolicy();

  return deletedRole;
};

module.exports = { createRole, getRoles, getRoleById, updateRole, deleteRole };
