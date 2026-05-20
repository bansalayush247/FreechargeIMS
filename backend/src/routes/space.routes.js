const express = require("express");

const router = express.Router();

const spaceController = require(
  "../controllers/space.controller"
);

const authMiddleware = require("../middleware/auth.middleware");
const requireAdmin = require(
  "../middleware/requireAdmin.middleware"
);

router.post(
  "/",
  authMiddleware,
  requireAdmin,
  spaceController.createSpace
);

router.get(
  "/",
  authMiddleware,
  requireAdmin,
  spaceController.getSpaces
);

router.get(
  "/:id",
  authMiddleware,
  requireAdmin,
  spaceController.getSpaceById
);

router.patch(
  "/:id",
  authMiddleware,
  requireAdmin,
  spaceController.updateSpace
);

router.delete(
  "/:id",
  authMiddleware,
  requireAdmin,
  spaceController.deleteSpace
);

module.exports = router;
