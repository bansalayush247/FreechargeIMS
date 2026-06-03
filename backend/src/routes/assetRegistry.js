const express = require("express");

const assetRegistryController = require("../controllers/assetRegistry");
const authMiddleware = require("../middleware/auth");
const validateSpaceId = require("../middleware/validateSpaceId");
const authorize = require("../middleware/authorize");
const { PERMISSIONS } = require("../constants/permission");
const ROUTES = require("../constants/routes");

const router = express.Router();

router.get(ROUTES.ASSET_REGISTRY_ROUTES.LIST, authMiddleware, validateSpaceId, authorize(PERMISSIONS.ASSET_REGISTRY_VIEW), assetRegistryController.getAssetRegistry);
router.get(ROUTES.ASSET_REGISTRY_ROUTES.ME, authMiddleware, validateSpaceId, authorize(PERMISSIONS.ASSET_REGISTRY_VIEW), assetRegistryController.getMyAssetRegistry);
router.get(ROUTES.ASSET_REGISTRY_ROUTES.USER, authMiddleware, validateSpaceId, authorize(PERMISSIONS.ASSET_REGISTRY_VIEW), assetRegistryController.getUserAssetRegistry);

module.exports = router;
