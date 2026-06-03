const devSeedService = require("../services/devSeed");
const asyncHandler = require("../utils/asyncHandler");

const ROLE_BY_ENDPOINT = {
  "super-admin": "SUPER_ADMIN",
  "space-admin": "SPACE_ADMIN",
  manager: "MANAGER",
  "it-approver": "IT_APPROVER",
  "fulfillment-team": "FULFILLMENT_TEAM",
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
  seedItApprover: seedRole("it-approver"),
  seedFulfillmentTeam: seedRole("fulfillment-team"),
  seedZonalManager: seedRole("zonal-manager"),
  seedFos: seedRole("fos"),
  seedEmployee: seedRole("employee"),
};
