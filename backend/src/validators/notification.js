const Joi = require("joi");

const {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPES,
} = require("../constants/notification");

const mongoId = Joi.string().hex().length(24);

const sendEmailNotificationSchema = Joi.object({
  recipientUserId: mongoId.optional(),

  recipientEmail: Joi.string().email().optional(),

  type: Joi.string()
    .valid(...Object.values(NOTIFICATION_TYPES))
    .default(NOTIFICATION_TYPES.MANUAL),

  subject: Joi.string().trim().required(),

  body: Joi.string().trim().required(),

  html: Joi.string().trim().allow("").optional(),

  metadata: Joi.object().optional(),
}).or("recipientUserId", "recipientEmail");

const getNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(10),

  recipientUserId: mongoId.optional(),

  recipientEmail: Joi.string().email().optional(),

  status: Joi.string()
    .valid(...Object.values(NOTIFICATION_STATUS))
    .optional(),

  type: Joi.string()
    .valid(...Object.values(NOTIFICATION_TYPES))
    .optional(),

  channel: Joi.string()
    .valid(...Object.values(NOTIFICATION_CHANNELS))
    .optional(),
});

module.exports = {
  sendEmailNotificationSchema,
  getNotificationsSchema,
};
