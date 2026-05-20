const express = require("express");

const router = express.Router();

const assetRequestController = require(
  "../controllers/assetRequest.controller"
);

const authMiddleware = require(
  "../middleware/auth.middleware"
);

const authorize = require(
  "../middleware/authorize.middleware"
);

const {
  ASSET_REQUEST_PERMISSIONS,
} = require(
  "../constants/assetRequest.constant"
);

router.post(
  "/",
  authMiddleware,
  authorize(
    ASSET_REQUEST_PERMISSIONS.CREATE_ASSET_REQUEST
  ),
  assetRequestController.createAssetRequest
);

router.get(
  "/",
  authMiddleware,
  authorize(
    ASSET_REQUEST_PERMISSIONS.VIEW_ASSET_REQUEST
  ),
  assetRequestController.getAssetRequests
);

router.get(
  "/:id",
  authMiddleware,
  authorize(
    ASSET_REQUEST_PERMISSIONS.VIEW_ASSET_REQUEST
  ),
  assetRequestController.getAssetRequestById
);

router.patch(
  "/:id/manager-approve",
  authMiddleware,
  authorize(
    ASSET_REQUEST_PERMISSIONS.MANAGER_APPROVE_ASSET_REQUEST
  ),
  assetRequestController.managerApproveRequest
);

router.patch(
  "/:id/it-approve",
  authMiddleware,
  authorize(
    ASSET_REQUEST_PERMISSIONS.IT_APPROVE_ASSET_REQUEST
  ),
  assetRequestController.itApproveRequest
);

router.patch(
  "/:id/reject",
  authMiddleware,
  authorize(
    ASSET_REQUEST_PERMISSIONS.REJECT_ASSET_REQUEST
  ),
  assetRequestController.rejectRequest
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  authorize(
    ASSET_REQUEST_PERMISSIONS.CANCEL_ASSET_REQUEST
  ),
  assetRequestController.cancelRequest
);

module.exports = router;