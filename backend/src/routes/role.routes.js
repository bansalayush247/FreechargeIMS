const express = require("express");

const router = express.Router();

const roleController = require(
  "../controllers/role.controller"
);

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validateSpaceId = require(
  "../middleware/validateSpaceId.middleware"
);

const {
  PERMISSIONS,
} = require("../constants/permission.constant");

router.post(
  "/",
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.CREATE_ROLE),
  roleController.createRole
);

router.get(
  "/",
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.VIEW_ROLE),
  roleController.getRoles
);

router.get(
  "/:id",
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.VIEW_ROLE),
  roleController.getRoleById
);

router.patch(
  "/:id",
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.UPDATE_ROLE),
  roleController.updateRole
);

router.delete(
  "/:id",
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.DELETE_ROLE),
  roleController.deleteRole
);

module.exports = router;
