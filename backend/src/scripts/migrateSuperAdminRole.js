const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const logger = require("../config/logger");
const Role = require("../models/role");
const UserRole = require("../models/userRole");
const WorkflowDefinition = require("../models/workflowDefinition");

const LEGACY_ROLE_CODE = "GLOBAL_ADMIN";
const TARGET_ROLE_CODE = "SUPER_ADMIN";
const TARGET_ROLE_NAME = "Super Admin";

const uniqueValues = (values) => [...new Set(values.filter(Boolean).map(String))];

const mergePermissions = (...permissionGroups) => uniqueValues(permissionGroups.flat());

async function replaceWorkflowRoleReferences(spaceId, fromRoleId, toRoleId) {
  const workflows = await WorkflowDefinition.find({
    spaceId,
    isDeleted: { $ne: true },
    steps: {
      $elemMatch: {
        approverRoleIds: fromRoleId,
      },
    },
  });

  let modifiedCount = 0;

  for (const workflow of workflows) {
    let changed = false;

    for (const step of workflow.steps) {
      const nextApproverRoleIds = step.approverRoleIds.map((roleId) => {
        if (String(roleId) !== String(fromRoleId)) {
          return roleId;
        }

        changed = true;
        return toRoleId;
      });

      step.approverRoleIds = nextApproverRoleIds;
    }

    if (changed) {
      await workflow.save();
      modifiedCount += 1;
    }
  }

  return modifiedCount;
}

async function migrateLegacyRole(role) {
  const targetRole = await Role.findOne({
    spaceId: role.spaceId,
    code: TARGET_ROLE_CODE,
    isDeleted: { $ne: true },
  });

  if (!targetRole || String(targetRole._id) === String(role._id)) {
    const result = await Role.updateOne(
      { _id: role._id },
      {
        $set: {
          code: TARGET_ROLE_CODE,
          name: TARGET_ROLE_NAME,
          isSystemRole: true,
          isActive: true,
        },
      }
    );

    logger.info("Legacy role updated in place", {
      roleId: role._id,
      spaceId: role.spaceId,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });

    return {
      merged: false,
      userRolesUpdated: 0,
      workflowsUpdated: 0,
    };
  }

  const mergedPermissions = mergePermissions(
    targetRole.permissions,
    role.permissions
  );

  await Role.updateOne(
    { _id: targetRole._id },
    {
      $set: {
        name: TARGET_ROLE_NAME,
        code: TARGET_ROLE_CODE,
        permissions: mergedPermissions,
        isSystemRole: true,
        isActive: true,
      },
    }
  );

  const userRoleResult = await UserRole.updateMany(
    {
      spaceId: role.spaceId,
      roleId: role._id,
      isDeleted: { $ne: true },
    },
    {
      $set: {
        roleId: targetRole._id,
      },
    }
  );

  const workflowCount = await replaceWorkflowRoleReferences(
    role.spaceId,
    role._id,
    targetRole._id
  );

  await Role.updateOne(
    { _id: role._id },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
      },
    }
  );

  logger.info("Legacy role merged into existing super admin role", {
    legacyRoleId: role._id,
    targetRoleId: targetRole._id,
    spaceId: role.spaceId,
    userRolesUpdated: userRoleResult.modifiedCount,
    workflowsUpdated: workflowCount,
  });

  return {
    merged: true,
    userRolesUpdated: userRoleResult.modifiedCount,
    workflowsUpdated: workflowCount,
  };
}

async function migrateSuperAdminRole() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is required");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const legacyRoles = await Role.find({
      code: LEGACY_ROLE_CODE,
      isDeleted: { $ne: true },
    });

    if (!legacyRoles.length) {
      logger.info("No legacy global admin roles found");
      await mongoose.disconnect();
      process.exit(0);
    }

    let processedCount = 0;
    let mergedCount = 0;

    for (const role of legacyRoles) {
      const result = await migrateLegacyRole(role);
      processedCount += 1;

      if (result.merged) {
        mergedCount += 1;
      }
    }

    logger.info("Super admin role migration completed", {
      legacyRolesFound: legacyRoles.length,
      rolesProcessed: processedCount,
      rolesMerged: mergedCount,
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error("Super admin role migration failed", {
      error: error.message,
      stack: error.stack,
    });

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      logger.error("Failed to disconnect mongoose after migration error", {
        error: disconnectError.message,
      });
    }

    process.exit(1);
  }
}

migrateSuperAdminRole();