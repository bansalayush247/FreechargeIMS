const express = require("express");

const router = express.Router();

const devSeedController = require("../controllers/devSeed");
const devOnly = require("../middleware/devOnly");
const ROUTES = require("../constants/routes");

router.use(devOnly);

router.post(ROUTES.DEV_SEED_ROUTES.ALL, devSeedController.seedAll);
router.post(ROUTES.DEV_SEED_ROUTES.SUPER_ADMIN, devSeedController.seedSuperAdmin);
router.post(ROUTES.DEV_SEED_ROUTES.SPACE_ADMIN, devSeedController.seedSpaceAdmin);
router.post(ROUTES.DEV_SEED_ROUTES.MANAGER, devSeedController.seedManager);
router.post(ROUTES.DEV_SEED_ROUTES.IT_APPROVER, devSeedController.seedItApprover);
router.post(ROUTES.DEV_SEED_ROUTES.FULFILLMENT_TEAM, devSeedController.seedFulfillmentTeam);
router.post(ROUTES.DEV_SEED_ROUTES.ZONAL_MANAGER, devSeedController.seedZonalManager);
router.post(ROUTES.DEV_SEED_ROUTES.FOS, devSeedController.seedFos);
router.post(ROUTES.DEV_SEED_ROUTES.EMPLOYEE, devSeedController.seedEmployee);

module.exports = router;
