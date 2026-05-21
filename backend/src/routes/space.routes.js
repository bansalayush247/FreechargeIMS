const express = require("express");

const router = express.Router();

const spaceController = require(
  "../controllers/space"
);

const authMiddleware = require("../middleware/auth");
const requireAdmin = require(
  "../middleware/requireAdmin"
);

const ROUTES = require("../constants/routes");

router.post(
  ROUTES.SPACES.CREATE,
  authMiddleware,
  requireAdmin,
  spaceController.createSpace
);

router.get(
  ROUTES.SPACES.LIST,
  authMiddleware,
  requireAdmin,
  spaceController.getSpaces
);

router.get(
  ROUTES.SPACES.GET_BY_ID,
  authMiddleware,
  requireAdmin,
  spaceController.getSpaceById
);

router.patch(
  ROUTES.SPACES.UPDATE,
  authMiddleware,
  requireAdmin,
  spaceController.updateSpace
);

router.delete(
  ROUTES.SPACES.DELETE,
  authMiddleware,
  requireAdmin,
  spaceController.deleteSpace
);

module.exports = router;
