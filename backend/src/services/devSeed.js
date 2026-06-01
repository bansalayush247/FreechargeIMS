const User = require("../models/user");
const Space = require("../models/space");
const Role = require("../models/role");
const SpaceMember = require("../models/spaceMember");
const UserRole = require("../models/userRole");
const Product = require("../models/product");
const Warehouse = require("../models/warehouse");
const InventoryItem = require("../models/inventory");
const Merchant = require("../models/merchant");
const AssetRequest = require("../models/assetRequest");
const WorkflowInstance = require("../models/workflowInstance");

const assetRequestService = require("./assetRequest");
const {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshExpiryDate,
} = require("./auth.tokens");
const { createRefreshToken } = require("../repositories/refreshToken");

const { USER_TYPES } = require("../constants/user");
const { ROLE_CODES } = require("../constants/role");
const { PERMISSIONS } = require("../constants/permission");
const { PRODUCT_ASSET_TYPES } = require("../constants/product");
const { INVENTORY_STATUS } = require("../constants/inventory");
const {
  ASSET_REQUEST_STATUS,
  ASSET_REQUEST_TYPE,
} = require("../constants/assetRequest");

const TEST_PASSWORD = "Password@123";

const SPACE_FIXTURES = {
  corporate: {
    name: "Corporate",
    code: "CORPORATE",
    type: "EMPLOYEE",
  },
  merchantOperations: {
    name: "Merchant Operations",
    code: "MERCHANT_OPERATIONS",
    type: "MERCHANT",
  },
};

const ROLE_FIXTURES = {
  SUPER_ADMIN: {
    name: "Super Admin",
    code: ROLE_CODES.SUPER_ADMIN,
    permissions: Object.values(PERMISSIONS),
    spaceKey: "corporate",
  },
  SPACE_ADMIN: {
    name: "Space Admin",
    code: ROLE_CODES.SPACE_ADMIN,
    permissions: Object.values(PERMISSIONS),
    spaceKey: "corporate",
  },
  MANAGER: {
    name: "Manager",
    code: ROLE_CODES.MANAGER,
    permissions: [
      PERMISSIONS.VIEW_ASSET_REQUEST,
      PERMISSIONS.APPROVE_ASSET_REQUEST,
      PERMISSIONS.MANAGER_APPROVE_ASSET_REQUEST,
      PERMISSIONS.REJECT_ASSET_REQUEST,
    ],
    spaceKey: "corporate",
  },
  IT_ADMIN: {
    name: "IT Admin",
    code: ROLE_CODES.IT_ADMIN,
    permissions: [
      PERMISSIONS.VIEW_ASSET_REQUEST,
      PERMISSIONS.APPROVE_ASSET_REQUEST,
      PERMISSIONS.IT_APPROVE_ASSET_REQUEST,
      PERMISSIONS.REJECT_ASSET_REQUEST,
      PERMISSIONS.VIEW_INVENTORY,
    ],
    spaceKey: "corporate",
  },
  WAREHOUSE_ADMIN: {
    name: "Warehouse Admin",
    code: ROLE_CODES.WAREHOUSE_ADMIN,
    permissions: [
      PERMISSIONS.VIEW_ASSET_REQUEST,
      PERMISSIONS.FULFILL_ASSET_REQUEST,
      PERMISSIONS.WAREHOUSE_FULFILL_ASSET_REQUEST,
      PERMISSIONS.CREATE_INVENTORY_TRANSACTION,
      PERMISSIONS.VIEW_INVENTORY_TRANSACTION,
      PERMISSIONS.VIEW_INVENTORY,
      PERMISSIONS.UPDATE_INVENTORY,
    ],
    spaceKey: "merchantOperations",
  },
  ZONAL_MANAGER: {
    name: "Zonal Manager",
    code: ROLE_CODES.ZONAL_MANAGER,
    permissions: [
      PERMISSIONS.VIEW_ASSET_REQUEST,
      PERMISSIONS.APPROVE_ASSET_REQUEST,
      PERMISSIONS.ZONAL_MANAGER_APPROVE_ASSET_REQUEST,
      PERMISSIONS.REJECT_ASSET_REQUEST,
    ],
    spaceKey: "merchantOperations",
  },
  FOS: {
    name: "FOS",
    code: ROLE_CODES.FOS,
    permissions: [
      PERMISSIONS.CREATE_ASSET_REQUEST,
      PERMISSIONS.VIEW_ASSET_REQUEST,
      PERMISSIONS.VIEW_MERCHANT,
    ],
    spaceKey: "merchantOperations",
  },
  EMPLOYEE: {
    name: "Employee",
    code: ROLE_CODES.EMPLOYEE,
    permissions: [
      PERMISSIONS.CREATE_ASSET_REQUEST,
      PERMISSIONS.VIEW_ASSET_REQUEST,
      PERMISSIONS.CANCEL_ASSET_REQUEST,
    ],
    spaceKey: "corporate",
  },
};

const USER_FIXTURES = {
  SUPER_ADMIN: { endpoint: "super-admin", email: "super-admin@freecharge.test", employeeId: "DEV-SA-001", firstName: "Super", lastName: "Admin", userType: USER_TYPES.ADMIN },
  SPACE_ADMIN: { endpoint: "space-admin", email: "space-admin@freecharge.test", employeeId: "DEV-SPA-001", firstName: "Space", lastName: "Admin", userType: USER_TYPES.ADMIN },
  MANAGER: { endpoint: "manager", email: "manager@freecharge.test", employeeId: "DEV-MGR-001", firstName: "Maya", lastName: "Manager", userType: USER_TYPES.EMPLOYEE },
  IT_ADMIN: { endpoint: "it-admin", email: "it-admin@freecharge.test", employeeId: "DEV-IT-001", firstName: "Ishan", lastName: "IT", userType: USER_TYPES.EMPLOYEE },
  WAREHOUSE_ADMIN: { endpoint: "warehouse-admin", email: "warehouse-admin@freecharge.test", employeeId: "DEV-WH-001", firstName: "Wahid", lastName: "Warehouse", userType: USER_TYPES.EMPLOYEE },
  ZONAL_MANAGER: { endpoint: "zonal-manager", email: "zonal-manager@freecharge.test", employeeId: "DEV-ZM-001", firstName: "Zara", lastName: "Zonal", userType: USER_TYPES.EMPLOYEE },
  FOS: { endpoint: "fos", email: "fos@freecharge.test", employeeId: "DEV-FOS-001", firstName: "Farhan", lastName: "FOS", userType: USER_TYPES.EMPLOYEE },
  EMPLOYEE: { endpoint: "employee", email: "employee@freecharge.test", employeeId: "DEV-EMP-001", firstName: "Esha", lastName: "Employee", userType: USER_TYPES.EMPLOYEE },
};

const upsertSpace = async (fixture, actorId = null) => {
  return Space.findOneAndUpdate(
    { code: fixture.code, isDeleted: false },
    {
      $set: { ...fixture, isActive: true, updatedBy: actorId },
      $setOnInsert: { createdBy: actorId },
    },
    { upsert: true, returnDocument: "after" }
  );
};

const upsertRole = async (spaceId, roleKey, actorId = null) => {
  const fixture = ROLE_FIXTURES[roleKey];
  return Role.findOneAndUpdate(
    { spaceId, code: fixture.code, isDeleted: false },
    {
      $set: {
        name: fixture.name,
        code: fixture.code,
        permissions: fixture.permissions,
        isSystemRole: true,
        isActive: true,
        updatedBy: actorId,
      },
      $setOnInsert: { createdBy: actorId },
    },
    { upsert: true, returnDocument: "after" }
  );
};

const upsertUser = async (roleKey) => {
  const fixture = USER_FIXTURES[roleKey];
  let user = await User.findOne({ email: fixture.email, isDeleted: false }).select("+password");

  if (!user) {
    user = await User.create({
      ...fixture,
      password: TEST_PASSWORD,
      isActive: true,
    });
    return user;
  }

  user.employeeId = fixture.employeeId;
  user.firstName = fixture.firstName;
  user.lastName = fixture.lastName;
  user.userType = fixture.userType;
  user.password = TEST_PASSWORD;
  user.isActive = true;
  await user.save();

  return user;
};

const ensureMembershipAndRole = async ({ user, spaceId, role }) => {
  await SpaceMember.findOneAndUpdate(
    { userId: user._id, spaceId, isDeleted: { $ne: true } },
    {
      $set: { isActive: true, updatedBy: user._id },
      $setOnInsert: { joinedAt: new Date(), createdBy: user._id },
    },
    { upsert: true, returnDocument: "after" }
  );

  await UserRole.findOneAndUpdate(
    { userId: user._id, spaceId, roleId: role._id, isDeleted: { $ne: true } },
    {
      $set: { assignedBy: user._id, updatedBy: user._id },
      $setOnInsert: { createdBy: user._id },
    },
    { upsert: true, returnDocument: "after" }
  );
};

const issueTokens = async (user) => {
  const accessToken = generateAccessToken(user);
  const { token: refreshToken, jti } = generateRefreshToken();

  await createRefreshToken({
    userId: user._id,
    tokenHash: hashRefreshToken(refreshToken),
    jti,
    expiresAt: getRefreshExpiryDate(),
    createdByIp: "127.0.0.1",
    userAgent: "dev-seed",
  });

  return { accessToken, refreshToken };
};
 
const seedRoleUser = async (roleKey, spaces = null, roles = null) => {
  const seededSpaces = spaces || await seedSpaces();
  const roleFixture = ROLE_FIXTURES[roleKey];
  const space = seededSpaces[roleFixture.spaceKey];
  const seededRoles = roles || await seedRoles(seededSpaces);
  const role = seededRoles[roleKey];
  const user = await upsertUser(roleKey);

  await ensureMembershipAndRole({ user, spaceId: space._id, role });

  if (roleKey === "WAREHOUSE_ADMIN") {
    const corporateWarehouseRole = await upsertRole(
      seededSpaces.corporate._id,
      "WAREHOUSE_ADMIN",
      user._id
    );
    await ensureMembershipAndRole({
      user,
      spaceId: seededSpaces.corporate._id,
      role: corporateWarehouseRole,
    });
  }

  const tokens = await issueTokens(user);

  return {
    email: USER_FIXTURES[roleKey].email,
    password: TEST_PASSWORD,
    role: roleKey,
    userId: user._id,
    spaceId: space._id,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const seedSpaces = async () => {
  const corporate = await upsertSpace(SPACE_FIXTURES.corporate);
  const merchantOperations = await upsertSpace(SPACE_FIXTURES.merchantOperations);
  return { corporate, merchantOperations };
};

const seedRoles = async (spaces) => {
  const roles = {};

  for (const roleKey of Object.keys(ROLE_FIXTURES)) {
    const space = spaces[ROLE_FIXTURES[roleKey].spaceKey];
    roles[roleKey] = await upsertRole(space._id, roleKey);
  }

  return roles;
};

const upsertMerchant = async (spaceId, fixture, actorId) => {
  return Merchant.findOneAndUpdate(
    { spaceId, merchantCode: fixture.merchantCode, isDeleted: false },
    {
      $set: { ...fixture, spaceId, isActive: true, updatedBy: actorId },
      $setOnInsert: { createdBy: actorId },
    },
    { upsert: true, returnDocument: "after" }
  );
};

const upsertWarehouse = async (spaceId, fixture, actorId) => {
  return Warehouse.findOneAndUpdate(
    { spaceId, code: fixture.code, isDeleted: false },
    {
      $set: { ...fixture, spaceId, isActive: true, updatedBy: actorId },
      $setOnInsert: { createdBy: actorId },
    },
    { upsert: true, returnDocument: "after" }
  );
};

const upsertProduct = async (fixture, actorId) => {
  return Product.findOneAndUpdate(
    { sku: fixture.sku, isDeleted: false },
    {
      $set: { ...fixture, updatedBy: actorId },
      $setOnInsert: { createdBy: actorId },
    },
    { upsert: true, returnDocument: "after" }
  );
};

const upsertInventoryItem = async (fixture, actorId) => {
  return InventoryItem.findOneAndUpdate(
    { assetTag: fixture.assetTag, isDeleted: false },
    {
      $set: { ...fixture, updatedBy: actorId },
      $setOnInsert: { createdBy: actorId },
    },
    { upsert: true, returnDocument: "after" }
  );
};

const ensureSampleRequest = async ({ requestType, user, spaceId, productId, merchantId }) => {
  const existing = await AssetRequest.findOne({
    spaceId,
    employeeId: user._id,
    requestType,
    productId,
    status: {
      $nin: [
        ASSET_REQUEST_STATUS.FULFILLED,
        ASSET_REQUEST_STATUS.CANCELLED,
        ASSET_REQUEST_STATUS.REJECTED,
      ],
    },
    isDeleted: false,
  }).lean();

  if (existing) {
    return existing;
  }

  return assetRequestService.createAssetRequest(
    {
      requestType,
      merchantId,
      productId,
      requestedQuantity: 1,
      businessJustification:
        requestType === ASSET_REQUEST_TYPE.EMPLOYEE_ASSET
          ? "Development seed employee asset request"
          : "Development seed merchant asset request",
      priority: "MEDIUM",
    },
    user._id,
    { spaceId }
  );
};

const seedAll = async () => {
  const spaces = await seedSpaces();
  const roles = await seedRoles(spaces);
  const users = {};

  for (const roleKey of Object.keys(USER_FIXTURES)) {
    users[roleKey] = await seedRoleUser(roleKey, spaces, roles);
  }

  const actorId = users.SUPER_ADMIN.userId;
  const merchants = {
    sampleMerchant1: await upsertMerchant(spaces.merchantOperations._id, {
      merchantCode: "MERCHANT_001",
      name: "Sample Merchant 1",
      contactName: "Ravi Merchant",
      contactPhone: "9999990001",
      contactEmail: "merchant1@freecharge.test",
      address: "Delhi",
    }, actorId),
    sampleMerchant2: await upsertMerchant(spaces.merchantOperations._id, {
      merchantCode: "MERCHANT_002",
      name: "Sample Merchant 2",
      contactName: "Neha Merchant",
      contactPhone: "9999990002",
      contactEmail: "merchant2@freecharge.test",
      address: "Noida",
    }, actorId),
  };

  const warehouses = {
    centralWarehouse: await upsertWarehouse(spaces.corporate._id, {
      name: "Central Warehouse",
      code: "CENTRAL_WAREHOUSE",
      type: "CENTRAL",
      address: { city: "Gurugram", state: "Haryana", pincode: "122001" },
    }, actorId),
    delhiWarehouse: await upsertWarehouse(spaces.merchantOperations._id, {
      name: "Delhi Warehouse",
      code: "DELHI_WAREHOUSE",
      type: "REGIONAL",
      address: { city: "Delhi", state: "Delhi", pincode: "110001" },
    }, actorId),
  };

  const products = {
    laptop: await upsertProduct({ sku: "LAPTOP-SEED-001", name: "Laptop", category: "LAPTOPS", brand: "Lenovo", model: "ThinkPad", assetType: PRODUCT_ASSET_TYPES.NON_CONSUMABLE, minimumStock: 2, isTrackable: true }, actorId),
    monitor: await upsertProduct({ sku: "MONITOR-SEED-001", name: "Monitor", category: "MONITORS", brand: "Dell", model: "24 Inch", assetType: PRODUCT_ASSET_TYPES.NON_CONSUMABLE, minimumStock: 2, isTrackable: true }, actorId),
    posDevice: await upsertProduct({ sku: "POS-SEED-001", name: "POS Device", category: "POS_DEVICES", brand: "Pine Labs", model: "POS-X", assetType: PRODUCT_ASSET_TYPES.NON_CONSUMABLE, minimumStock: 3, isTrackable: true }, actorId),
    qrStandee: await upsertProduct({ sku: "QR-STANDEE-SEED-001", name: "QR Standee", category: "ACCESSORIES", brand: "Freecharge", model: "QR-A5", assetType: PRODUCT_ASSET_TYPES.NON_CONSUMABLE, minimumStock: 5, isTrackable: true }, actorId),
  };

  const inventory = {
    laptop1: await upsertInventoryItem({ spaceId: spaces.corporate._id, productId: products.laptop._id, warehouseId: warehouses.centralWarehouse._id, serialNumber: "DEV-LAP-001", assetTag: "FC-LAP-000001", status: INVENTORY_STATUS.AVAILABLE, quantity: 1 }, actorId),
    monitor1: await upsertInventoryItem({ spaceId: spaces.corporate._id, productId: products.monitor._id, warehouseId: warehouses.centralWarehouse._id, serialNumber: "DEV-MON-001", assetTag: "FC-MON-000001", status: INVENTORY_STATUS.AVAILABLE, quantity: 1 }, actorId),
    pos1: await upsertInventoryItem({ spaceId: spaces.merchantOperations._id, productId: products.posDevice._id, warehouseId: warehouses.delhiWarehouse._id, serialNumber: "DEV-POS-001", assetTag: "FC-POS-000001", status: INVENTORY_STATUS.AVAILABLE, quantity: 1 }, actorId),
    qrStandee1: await upsertInventoryItem({ spaceId: spaces.merchantOperations._id, productId: products.qrStandee._id, warehouseId: warehouses.delhiWarehouse._id, serialNumber: "DEV-QR-001", assetTag: "FC-ACC-000001", status: INVENTORY_STATUS.AVAILABLE, quantity: 1 }, actorId),
  };

  const employeeUser = await User.findById(users.EMPLOYEE.userId);
  const fosUser = await User.findById(users.FOS.userId);

  const sampleRequests = {
    employeeAssetRequest: await ensureSampleRequest({
      requestType: ASSET_REQUEST_TYPE.EMPLOYEE_ASSET,
      user: employeeUser,
      spaceId: spaces.corporate._id,
      productId: products.laptop._id,
    }),
    merchantAssetRequest: await ensureSampleRequest({
      requestType: ASSET_REQUEST_TYPE.MERCHANT_ASSET,
      user: fosUser,
      spaceId: spaces.merchantOperations._id,
      productId: products.posDevice._id,
      merchantId: merchants.sampleMerchant1._id,
    }),
  };

  const workflowInstances = await WorkflowInstance.find({
    entityId: { $in: [sampleRequests.employeeAssetRequest._id, sampleRequests.merchantAssetRequest._id] },
    isDeleted: false,
  }).lean();

  return {
    credentials: users,
    spaces,
    roles,
    merchants,
    warehouses,
    products,
    inventory,
    sampleRequests,
    workflowInstances,
  };
};

module.exports = {
  seedRoleUser,
  seedAll,
  USER_FIXTURES,
};
