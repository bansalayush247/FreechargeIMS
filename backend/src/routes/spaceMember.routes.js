const express = require("express");

const router = express.Router();

const spaceMemberController = require(
  "../controllers/spaceMember.controller"
);

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validateSpaceId = require(
  "../middleware/validateSpaceId.middleware"
);

const {
  PERMISSIONS,
} = require("../constants/permission.constant");

router.get(
  "/user-roles",
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.VIEW_ROLE),
  spaceMemberController.getUserRoles
);

router.post(
  "/user-roles",
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.ASSIGN_ROLE),
  spaceMemberController.assignRole
);

router.delete(
  "/user-roles/:id",
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.ASSIGN_ROLE),
  spaceMemberController.removeRole
);

router.post(
  "/",
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.UPDATE_SPACE),
  spaceMemberController.addMember
);

router.get(
  "/",
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.VIEW_SPACE),
  spaceMemberController.getMembers
);

router.patch(
  "/:id",
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.UPDATE_SPACE),
  spaceMemberController.updateMember
);

router.delete(
  "/:id",
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.UPDATE_SPACE),
  spaceMemberController.removeMember
);

module.exports = router;
