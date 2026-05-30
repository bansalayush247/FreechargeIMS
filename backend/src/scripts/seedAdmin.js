const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const User = require("../models/user");
const Space = require("../models/space");
const Role = require("../models/role");
const SpaceMember = require("../models/spaceMember");
const UserRole = require("../models/userRole");

const { USER_TYPES } = require("../constants/user");
const { ROLE_CODES } = require("../constants/role");
const { SYSTEM_SPACES } = require("../constants/space");
const {
  PERMISSIONS,
} = require("../constants/permission");

const logger = require("../config/logger");
const SUPER_ADMIN_SPACE = SYSTEM_SPACES.SUPER_ADMIN;

const getSeedAdminConfig = () => {
  const config = {
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    employeeId: process.env.SEED_ADMIN_EMPLOYEE_ID,
    firstName: process.env.SEED_ADMIN_FIRST_NAME || "Super",
    lastName: process.env.SEED_ADMIN_LAST_NAME || "Admin",
  };

  if (!config.email || !config.password || !config.employeeId) {
    throw new Error("SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD and SEED_ADMIN_EMPLOYEE_ID are required");
  }

  return config;
};

const SYSTEM_ROLES = [
  {
    name: "Space Admin",
    code: ROLE_CODES.SPACE_ADMIN,
    permissions: Object.values(PERMISSIONS),
  },
  {
    name: "Super Admin",
    code: ROLE_CODES.SUPER_ADMIN,
    permissions: Object.values(PERMISSIONS).filter((p) => !String(p).startsWith("DELETE_")),
  },
  {
    name: "Inventory Manager",
    code: ROLE_CODES.INVENTORY_MANAGER,
    permissions: [
      PERMISSIONS.CREATE_INVENTORY,
      PERMISSIONS.UPDATE_INVENTORY,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.ASSIGN_INVENTORY,
      PERMISSIONS.CREATE_REPAIR,
      PERMISSIONS.VIEW_REPAIR,
      PERMISSIONS.VIEW_NOTIFICATION,
      PERMISSIONS.CREATE_WORKFLOW,
      PERMISSIONS.VIEW_WORKFLOW,
      PERMISSIONS.UPDATE_WORKFLOW,
      PERMISSIONS.DELETE_WORKFLOW,
      PERMISSIONS.EXECUTE_WORKFLOW,
      PERMISSIONS.UPDATE_REPAIR,
      PERMISSIONS.COMPLETE_REPAIR,
      PERMISSIONS.CANCEL_REPAIR,
      PERMISSIONS.SEND_NOTIFICATION,
      PERMISSIONS.VIEW_NOTIFICATION,
    ],
  },
  {
    name: "Viewer",
    code: ROLE_CODES.VIEWER,
    permissions: [
      PERMISSIONS.CREATE_ASSET_REQUEST,
      PERMISSIONS.VIEW_SPACE,
      PERMISSIONS.VIEW_ROLE,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.VIEW_INVENTORY_TRANSACTION,
      PERMISSIONS.VIEW_REPAIR,
      PERMISSIONS.VIEW_NOTIFICATION,
    ],
  },
];

// Handles upsert generic system space.
const upsertSystemSpace = async (spacePayload, adminId, type = null) => {
  let space = await Space.findOne({
    code: spacePayload.code,
    isDeleted: { $ne: true },
  });

  if (space) return space;

  space = await Space.create({
    ...spacePayload,
    type,
    isActive: true,
    createdBy: adminId,
    updatedBy: adminId,
  });

  logger.info(`System space seeded: ${spacePayload.code}`, { spaceId: space._id });

  return space;
};

// Handles upsert super admin space.
const upsertSuperAdminSpace = async (adminId) => {
  let space = await Space.findOne({
    code: SUPER_ADMIN_SPACE.code,
    isDeleted: {
      $ne: true,
    },
  });

  if (space) {
    return space;
  }

  space = await Space.create({
    ...SUPER_ADMIN_SPACE,
    isActive: true,
    createdBy: adminId,
    updatedBy: adminId,
  });

  logger.info("Super admin space seeded", {
    spaceId: space._id,
  });

  return space;
};

// Handles upsert system roles.
const upsertSystemRoles = async (spaceId, adminId) => {
  const roles = [];

  for (const rolePayload of SYSTEM_ROLES) {
    const role = await Role.findOneAndUpdate(
      {
        spaceId,
        code: rolePayload.code,
        isDeleted: {
          $ne: true,
        },
      },
      {
        $set: {
          ...rolePayload,
          spaceId,
          isSystemRole: true,
          isActive: true,
          updatedBy: adminId,
        },
        $setOnInsert: {
          createdBy: adminId,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
      }
    );

    roles.push(role);
  }

  logger.info("System roles bootstrapped", {
    count: roles.length,
  });

  return roles;
};

// Handles upsert admin.
const upsertAdmin = async () => {
  const seedAdminConfig = getSeedAdminConfig();

  let admin = await User.findOne({
    email: seedAdminConfig.email,
    isDeleted: {
      $ne: true,
    },
  });

  if (admin) {
    logger.info("Admin already exists", {
      adminId: admin._id,
    });

    return admin;
  }

  admin = await User.create({
    employeeId: seedAdminConfig.employeeId,
    firstName: seedAdminConfig.firstName,
    lastName: seedAdminConfig.lastName,
    email: seedAdminConfig.email,
    password: seedAdminConfig.password,
    userType: USER_TYPES.ADMIN,
  });

  logger.info("Admin seeded successfully", {
    adminId: admin._id,
  });

  return admin;
};

// Handles upsert admin membership.
const upsertAdminMembership = async (
  spaceId,
  adminId,
  spaceAdminRole
) => {
  await SpaceMember.findOneAndUpdate(
    {
      spaceId,
      userId: adminId,
    },
    {
      $set: {
        isActive: true,
        isDeleted: false,
        updatedBy: adminId,
      },
      $setOnInsert: {
        joinedAt: new Date(),
        createdBy: adminId,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
    }
  );

  await UserRole.findOneAndUpdate(
    {
      spaceId,
      userId: adminId,
      roleId: spaceAdminRole._id,
    },
    {
      $set: {
        assignedBy: adminId,
        isDeleted: false,
        updatedBy: adminId,
      },
      $setOnInsert: {
        createdBy: adminId,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
    }
  );

  logger.info("Admin membership and role bootstrapped", {
    adminId,
    spaceId,
    roleId: spaceAdminRole._id,
  });
};

// Handles seed admin.
const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const admin = await upsertAdmin();
    const space = await upsertSuperAdminSpace(admin._id);
    const roles = await upsertSystemRoles(space._id, admin._id);

    const spaceAdminRole = roles.find(
      (role) => role.code === ROLE_CODES.SPACE_ADMIN
    );

    await upsertAdminMembership(
      space._id,
      admin._id,
      spaceAdminRole
    );

    // Also ensure IT team and warehouse system spaces and roles exist
    try {
      const itSpace = await upsertSystemSpace(SYSTEM_SPACES.IT_TEAM, admin._id, "EMPLOYEE");
      const warehouseSpace = await upsertSystemSpace(SYSTEM_SPACES.WAREHOUSE, admin._id, "MERCHANT");

      await upsertSystemRoles(itSpace._id, admin._id);
      await upsertSystemRoles(warehouseSpace._id, admin._id);

      // Assign space admin role in those system spaces to the seeded admin
      const itRoles = await Role.find({ spaceId: itSpace._id, code: ROLE_CODES.SPACE_ADMIN, isDeleted: { $ne: true } });
      const warehouseRoles = await Role.find({ spaceId: warehouseSpace._id, code: ROLE_CODES.SPACE_ADMIN, isDeleted: { $ne: true } });

      if (Array.isArray(itRoles) && itRoles[0]) {
        await upsertAdminMembership(itSpace._id, admin._id, itRoles[0]);
      }
      if (Array.isArray(warehouseRoles) && warehouseRoles[0]) {
        await upsertAdminMembership(warehouseSpace._id, admin._id, warehouseRoles[0]);
      }
    } catch (error) {
      logger.warn("Failed to bootstrap additional system spaces/roles", { error: error.message });
    }

    logger.info("Admin bootstrap completed");

    process.exit(0);
  } catch (error) {
    logger.error("Seed failed", {
      error: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
};

seedAdmin();


