const express = require("express");

const router = express.Router();

const spaceController = require(
  "../controllers/space"
);

const joinRequestController = require("../controllers/joinRequest");

const authorize = require("../middleware/authorize");
const { PERMISSIONS } = require("../constants/permission");

const authMiddleware = require("../middleware/auth");
const requireAdmin = require(
  "../middleware/requireAdmin"
);

const ROUTES = require("../constants/routes");

router.post(
  ROUTES.SPACES.CREATE,
  authMiddleware,
  // Allow authenticated users to create a space; creator will be auto-assigned as space admin
  spaceController.createSpace
);

router.get(
  ROUTES.SPACES.LIST,
  authMiddleware,
  // Allow authenticated users to view available spaces (removed requireAdmin)
  spaceController.getSpaces
);

// Spaces for current user
router.get(
  ROUTES.SPACES.MY,
  authMiddleware,
  spaceController.getMySpaces
);

router.get(
  ROUTES.SPACES.GET_BY_ID,
  authMiddleware,
  // Allow authenticated users to fetch a single space
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

// Join requests - create (any authenticated user)
router.post(
  ROUTES.SPACES.CREATE_JOIN_REQUEST,
  authMiddleware,
  joinRequestController.createJoinRequest
);

// Join requests - list for space admins
router.get(
  ROUTES.SPACES.LIST_JOIN_REQUESTS,
  authMiddleware,
  authorize(PERMISSIONS.UPDATE_SPACE),
  joinRequestController.getJoinRequests
);

// Join requests - list for requester
router.get(
  ROUTES.SPACES.LIST_MY_JOIN_REQUESTS,
  authMiddleware,
  joinRequestController.getMyJoinRequests
);

// Review (approve/reject) join request - space admins
router.patch(
  ROUTES.SPACES.REVIEW_JOIN_REQUEST,
  authMiddleware,
  authorize(PERMISSIONS.UPDATE_SPACE),
  joinRequestController.reviewJoinRequest
);

module.exports = router;
