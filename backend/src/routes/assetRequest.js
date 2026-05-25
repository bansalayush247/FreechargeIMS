const express = require("express");

const router = express.Router();

const assetRequestController = require(
  "../controllers/assetRequest"
);

const authMiddleware = require(
  "../middleware/auth"
);
const validateSpaceId = require(
  "../middleware/validateSpaceId"
);

const authorize = require(
  "../middleware/authorize"
);

const {
  ASSET_REQUEST_PERMISSIONS,
} = require(
  "../constants/assetRequest"
);

const ROUTES = require("../constants/routes");

router.post(
  ROUTES.ASSET_REQUEST_ROUTES.CREATE,
  authMiddleware,
  validateSpaceId,
  authorize(
    ASSET_REQUEST_PERMISSIONS.CREATE_ASSET_REQUEST
  ),
  assetRequestController.createAssetRequest
);

router.get(
  ROUTES.ASSET_REQUEST_ROUTES.LIST,
  authMiddleware,
  validateSpaceId,
  authorize(
    ASSET_REQUEST_PERMISSIONS.VIEW_ASSET_REQUEST
  ),
  assetRequestController.getAssetRequests
);

router.get(
  ROUTES.ASSET_REQUEST_ROUTES.GET_BY_ID,
  authMiddleware,
  validateSpaceId,
  authorize(
    ASSET_REQUEST_PERMISSIONS.VIEW_ASSET_REQUEST
  ),
  assetRequestController.getAssetRequestById
);

router.patch(
  ROUTES.ASSET_REQUEST_ROUTES.MANAGER_APPROVE,
  authMiddleware,
  validateSpaceId,
  authorize(
    ASSET_REQUEST_PERMISSIONS.MANAGER_APPROVE_ASSET_REQUEST
  ),
  assetRequestController.managerApproveRequest
);

router.patch(
  ROUTES.ASSET_REQUEST_ROUTES.IT_APPROVE,
  authMiddleware,
  validateSpaceId,
  authorize(
    ASSET_REQUEST_PERMISSIONS.IT_APPROVE_ASSET_REQUEST
  ),
  assetRequestController.itApproveRequest
);

router.patch(
  ROUTES.ASSET_REQUEST_ROUTES.FORWARD,
  authMiddleware,
  validateSpaceId,
  authorize(
    ASSET_REQUEST_PERMISSIONS.FORWARD_ASSET_REQUEST
  ),
  assetRequestController.forwardRequest
);

router.patch(
  ROUTES.ASSET_REQUEST_ROUTES.REJECT,
  authMiddleware,
  validateSpaceId,
  authorize(
    ASSET_REQUEST_PERMISSIONS.REJECT_ASSET_REQUEST
  ),
  assetRequestController.rejectRequest
);

router.patch(
  ROUTES.ASSET_REQUEST_ROUTES.CANCEL,
  authMiddleware,
  validateSpaceId,
  authorize(
    ASSET_REQUEST_PERMISSIONS.CANCEL_ASSET_REQUEST
  ),
  assetRequestController.cancelRequest
);

module.exports = router;
