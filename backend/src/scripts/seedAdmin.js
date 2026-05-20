const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const User = require("../models/user.model");
const Space = require("../models/space.model");
const Role = require("../models/role.model");
const SpaceMember = require("../models/spaceMember.model");
const UserRole = require("../models/userRole.model");

const { USER_TYPES } = require("../constants/user.constant");
const { ROLE_CODES } = require("../constants/role.constant");
const {
  PERMISSIONS,
} = require("../constants/permission.constant");

const logger = require("../config/logger");

const SUPER_ADMIN_SPACE = {
  name: "Super Admin Space",
  code: "SUPER_ADMIN",
  description: "System administration space",
};

const SYSTEM_ROLES = [
  {
    name: "Space Admin",
    code: ROLE_CODES.SPACE_ADMIN,
    permissions: Object.values(PERMISSIONS),
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
      PERMISSIONS.UPDATE_REPAIR,
      PERMISSIONS.COMPLETE_REPAIR,
      PERMISSIONS.CANCEL_REPAIR,
    ],
  },
  {
    name: "Viewer",
    code: ROLE_CODES.VIEWER,
    permissions: [
      PERMISSIONS.VIEW_SPACE,
      PERMISSIONS.VIEW_ROLE,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.VIEW_INVENTORY_TRANSACTION,
      PERMISSIONS.VIEW_REPAIR,
    ],
  },
];

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
        new: true,
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

const upsertAdmin = async () => {
  let admin = await User.findOne({
    email: "admin@freecharge.com",
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
    employeeId: "EMP001",
    firstName: "Super",
    lastName: "Admin",
    email: "admin@freecharge.com",
    password: "Admin@123",
    userType: USER_TYPES.ADMIN,
  });

  logger.info("Admin seeded successfully", {
    adminId: admin._id,
  });

  return admin;
};

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
      new: true,
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
      new: true,
      upsert: true,
    }
  );

  logger.info("Admin membership and role bootstrapped", {
    adminId,
    spaceId,
    roleId: spaceAdminRole._id,
  });
};

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
