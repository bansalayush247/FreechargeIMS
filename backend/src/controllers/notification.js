const notificationService = require("../services/notification");

const asyncHandler = require("../utils/asyncHandler");

const {
  sendEmailNotificationSchema,
  getNotificationsSchema,
} = require("../validators/notification");

// Handles get user id.
const getUserId = (req) => req.user._id || req.user.id;

// Handles get user email.
const getUserEmail = (req) => req.user.email;

// Handles send email notification.
const sendEmailNotification = asyncHandler(
  async (req, res) => {
    const { error, value } =
      sendEmailNotificationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const notification =
      await notificationService.sendEmailNotification(
        {
          ...value,
          spaceId: req.spaceId,
        },
        getUserId(req),
        { spaceId: req.spaceId }
      );

    return res.status(201).json({
      success: true,
      message: "Email notification processed successfully",
      data: notification,
    });
  }
);

// Handles get notifications.
const getNotifications = asyncHandler(async (req, res) => {
  const { error, value } = getNotificationsSchema.validate(
    req.query
  );

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const notifications =
    await notificationService.getNotifications({
      ...value,
      spaceId: req.spaceId,
    });

  return res.status(200).json({
    success: true,
    message: "Notifications fetched successfully",
    data: notifications,
  });
});

// Handles get notification by id.
const getNotificationById = asyncHandler(async (req, res) => {
  const notification =
    await notificationService.getNotificationById(
      req.params.id,
      {
        ownerUserId: getUserId(req),
        ownerEmail: getUserEmail(req),
        spaceId: req.spaceId,
      }
    );

  return res.status(200).json({
    success: true,
    message: "Notification fetched successfully",
    data: notification,
  });
});

module.exports = {
  sendEmailNotification,
  getNotifications,
  getNotificationById,
};
