const nodemailer = require("nodemailer");

const logger = require("../config/logger");

// Handles checking whether SMTP is configured.
const isEmailConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_FROM
  );
};

// Handles creating SMTP transport.
const createTransport = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
};

// Handles sending email.
const sendEmail = async ({ to, subject, text, html }) => {
  if (!isEmailConfigured()) {
    logger.warn("Email skipped because SMTP is not configured", {
      to,
      subject,
    });

    return {
      skipped: true,
      message: "SMTP is not configured",
    };
  }

  const transport = createTransport();

  const result = await transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });

  return {
    skipped: false,
    messageId: result.messageId,
  };
};

module.exports = {
  isEmailConfigured,
  sendEmail,
};
