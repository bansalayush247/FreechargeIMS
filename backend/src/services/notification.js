const notificationRepository = require(
  "../repositories/notification"
);
const { findActiveUserById } = require(
  "../repositories/user"
);
const emailService = require("./email");

const AppError = require("../utils/appError");
const logger = require("../config/logger");

const {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPES,
} = require("../constants/notification");

// Handles resolving notification recipient.
const resolveRecipient = async (payload) => {
  if (payload.recipientUserId) {
    const user = await findActiveUserById(payload.recipientUserId);

    if (!user) {
      throw new AppError("Recipient user not found", 404);
    }

    return {
      recipientUserId: user._id,
      recipientEmail: user.email,
    };
  }

  if (payload.recipientEmail) {
    return {
      recipientUserId: null,
      recipientEmail: payload.recipientEmail,
    };
  }

  throw new AppError("Recipient is required", 400);
};

// Handles sending email notification.
const sendEmailNotification = async (
  payload,
  userId = null
) => {
  const recipient = await resolveRecipient(payload);

  const notification = await notificationRepository.create({
    spaceId: payload.spaceId || null,
    recipientUserId: recipient.recipientUserId,
    recipientEmail: recipient.recipientEmail,
    channel: NOTIFICATION_CHANNELS.EMAIL,
    type: payload.type || NOTIFICATION_TYPES.MANUAL,
    subject: payload.subject,
    body: payload.body,
    status: NOTIFICATION_STATUS.PENDING,
    metadata: payload.metadata || {},
    createdBy: userId,
    updatedBy: userId,
  });

  try {
    const result = await emailService.sendEmail({
      to: recipient.recipientEmail,
      subject: payload.subject,
      text: payload.body,
      html: payload.html,
    });

    if (result.skipped) {
      return notificationRepository.updateById(notification._id, {
        status: NOTIFICATION_STATUS.SKIPPED,
        errorMessage: result.message,
        updatedBy: userId,
      });
    }

    return notificationRepository.updateById(notification._id, {
      status: NOTIFICATION_STATUS.SENT,
      providerMessageId: result.messageId || "",
      sentAt: new Date(),
      updatedBy: userId,
    });
  } catch (error) {
    logger.error("Email notification failed", {
      notificationId: notification._id,
      error: error.message,
    });

    return notificationRepository.updateById(notification._id, {
      status: NOTIFICATION_STATUS.FAILED,
      errorMessage: error.message,
      updatedBy: userId,
    });
  }
};

// Handles best effort user email notification.
const notifyUserByEmail = async (
  payload,
  userId = null
) => {
  try {
    return sendEmailNotification(payload, userId);
  } catch (error) {
    logger.error("Notification creation failed", {
      error: error.message,
      type: payload.type,
      recipientUserId: payload.recipientUserId,
      recipientEmail: payload.recipientEmail,
    });

    return null;
  }
};

// Handles get notifications.
const getNotifications = async (filters) => {
  return notificationRepository.paginate(filters);
};

// Handles get notification by id.
const getNotificationById = async (id) => {
  const notification = await notificationRepository.findById(id);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return notification;
};

module.exports = {
  sendEmailNotification,
  notifyUserByEmail,
  getNotifications,
  getNotificationById,
};
