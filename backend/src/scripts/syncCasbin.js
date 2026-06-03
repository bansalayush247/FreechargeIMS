const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const logger = require("../config/logger");
const Role = require("../models/role");
const UserRole = require("../models/userRole");
const { getEnforcer } = require("../config/casbin");
const { ROLE_CODES } = require("../constants/role");

async function syncCasbinPolicies() {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
    await mongoose.connect(process.env.MONGO_URI);

    const enforcer = await getEnforcer();
    
    // Clear the current internal enforcer rules cache
    enforcer.clearPolicy();

    // 1. Map active Mongoose Roles to Casbin Policy ('p') lines
    const roles = await Role.find({ isDeleted: false, isActive: true }).lean();
    for (const role of roles) {
      const scope = role.code === ROLE_CODES.SUPER_ADMIN ? "SYSTEM" : String(role.spaceId);
      const roleSubject = `${String(role.code)}:${scope}`;
      
      for (const permissionString of role.permissions) {
        const [resource, action] = permissionString.split(":");
        if (resource && action) {
          // Generates rule entry inside adapter context cache
          await enforcer.addPolicy(roleSubject, resource, action);
        }
      }
    }

    // 2. Map User-to-Role links into Grouping ('g') policies
    const userRoles = await UserRole.find({ isDeleted: false }).lean();
    for (const assignment of userRoles) {
      const matchedRole = roles.find((r) => String(r._id) === String(assignment.roleId));
      if (matchedRole) {
        const scope = matchedRole.code === ROLE_CODES.SUPER_ADMIN ? "SYSTEM" : String(assignment.spaceId);
        const userSubject = `${String(assignment.userId)}:${scope}`;
        const roleSubject = `${String(matchedRole.code)}:${scope}`;
        
        // Tells Casbin this user possesses this role inside this space
        await enforcer.addGroupingPolicy(userSubject, roleSubject);
      }
    }

    // Persist your runtime policies down into the casbinpolicies mongo collection
    await enforcer.savePolicy();
    
    logger.info("Casbin authorization rules database sync completed successfully.");
    process.exit(0);
  } catch (error) {
    logger.error("Casbin database policy sync failed:", { error: error.message });
    process.exit(1);
  }
}

syncCasbinPolicies();
