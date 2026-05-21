const express = require("express");

const router = express.Router();

const notificationController = require(
  "../controllers/notification"
);

const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const {
  NOTIFICATION_PERMISSIONS,
} = require("../constants/notification");

const ROUTES = require("../constants/routes");

router.post(
  ROUTES.NOTIFICATION_ROUTES.SEND_EMAIL,
  authMiddleware,
  authorize(NOTIFICATION_PERMISSIONS.SEND_NOTIFICATION),
  notificationController.sendEmailNotification
);

router.get(
  ROUTES.NOTIFICATION_ROUTES.LIST,
  authMiddleware,
  authorize(NOTIFICATION_PERMISSIONS.VIEW_NOTIFICATION),
  notificationController.getNotifications
);

router.get(
  ROUTES.NOTIFICATION_ROUTES.GET_BY_ID,
  authMiddleware,
  authorize(NOTIFICATION_PERMISSIONS.VIEW_NOTIFICATION),
  notificationController.getNotificationById
);

module.exports = router;
