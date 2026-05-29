const express = require("express");

const router = express.Router();

const roleController = require("../controllers/role");
const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateSpaceId = require("../middleware/validateSpaceId");

const { PERMISSIONS } = require("../constants/permission");

const ROUTES = require("../constants/routes");

router.post(ROUTES.ROLES.CREATE, authMiddleware, validateSpaceId, authorize(PERMISSIONS.CREATE_ROLE), roleController.createRole);
router.get(ROUTES.ROLES.LIST, authMiddleware, validateSpaceId, authorize(PERMISSIONS.VIEW_ROLE), roleController.getRoles);
router.get(ROUTES.ROLES.GET_BY_ID, authMiddleware, validateSpaceId, authorize(PERMISSIONS.VIEW_ROLE), roleController.getRoleById);
router.patch(ROUTES.ROLES.UPDATE, authMiddleware, validateSpaceId, authorize(PERMISSIONS.UPDATE_ROLE), roleController.updateRole);
router.delete(ROUTES.ROLES.DELETE, authMiddleware, validateSpaceId, authorize(PERMISSIONS.DELETE_ROLE), roleController.deleteRole);

module.exports = router;
