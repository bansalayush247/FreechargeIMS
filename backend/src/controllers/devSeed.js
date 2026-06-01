const devSeedService = require("../services/devSeed");
const asyncHandler = require("../utils/asyncHandler");

const ROLE_BY_ENDPOINT = {
  "super-admin": "SUPER_ADMIN",
  "space-admin": "SPACE_ADMIN",
  manager: "MANAGER",
  "it-admin": "IT_ADMIN",
  "warehouse-admin": "WAREHOUSE_ADMIN",
  "zonal-manager": "ZONAL_MANAGER",
  fos: "FOS",
  employee: "EMPLOYEE",
};

const seedRole = (endpoint) =>
  asyncHandler(async (req, res) => {
    const result = await devSeedService.seedRoleUser(ROLE_BY_ENDPOINT[endpoint]);

    return res.status(200).json({
      success: true,
      message: `${result.role} test user ready`,
      data: result,
    });
  });

const seedAll = asyncHandler(async (req, res) => {
  const result = await devSeedService.seedAll();

  return res.status(200).json({
    success: true,
    message: "Development seed data ready",
    data: result,
  });
});

module.exports = {
  seedAll,
  seedSuperAdmin: seedRole("super-admin"),
  seedSpaceAdmin: seedRole("space-admin"),
  seedManager: seedRole("manager"),
  seedItAdmin: seedRole("it-admin"),
  seedWarehouseAdmin: seedRole("warehouse-admin"),
  seedZonalManager: seedRole("zonal-manager"),
  seedFos: seedRole("fos"),
  seedEmployee: seedRole("employee"),
};
