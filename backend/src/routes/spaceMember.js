const express = require("express");

const router = express.Router();

const spaceMemberController = require("../controllers/spaceMember");

const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateSpaceId = require("../middleware/validateSpaceId");

const { PERMISSIONS } = require("../constants/permission");
const ROUTES = require("../constants/routes");

router.get(ROUTES.SPACE_MEMBER_ROUTES.USER_ROLES, authMiddleware, validateSpaceId, authorize(PERMISSIONS.VIEW_ROLE), spaceMemberController.getUserRoles);
router.post(ROUTES.SPACE_MEMBER_ROUTES.ASSIGN_ROLE, authMiddleware, validateSpaceId, authorize(PERMISSIONS.ASSIGN_ROLE), spaceMemberController.assignRole);
router.patch(ROUTES.SPACE_MEMBER_ROUTES.REPLACE_ROLE, authMiddleware, validateSpaceId, authorize(PERMISSIONS.ASSIGN_ROLE), spaceMemberController.replaceRole);
router.delete(ROUTES.SPACE_MEMBER_ROUTES.REMOVE_ROLE, authMiddleware, validateSpaceId, authorize(PERMISSIONS.ASSIGN_ROLE), spaceMemberController.removeRole);
router.post(ROUTES.SPACE_MEMBER_ROUTES.CREATE, authMiddleware, validateSpaceId, authorize(PERMISSIONS.UPDATE_SPACE), spaceMemberController.addMember);
router.get(ROUTES.SPACE_MEMBER_ROUTES.LIST, authMiddleware, validateSpaceId, authorize(PERMISSIONS.VIEW_SPACE), spaceMemberController.getMembers);
router.patch(ROUTES.SPACE_MEMBER_ROUTES.UPDATE, authMiddleware, validateSpaceId, authorize(PERMISSIONS.UPDATE_SPACE), spaceMemberController.updateMember);
router.delete(ROUTES.SPACE_MEMBER_ROUTES.DELETE, authMiddleware, validateSpaceId, authorize(PERMISSIONS.UPDATE_SPACE), spaceMemberController.removeMember);

module.exports = router;
