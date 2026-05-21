const logger = require("../config/logger");

const responseLogger = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    const statusCode = res.statusCode;
    const method = req.method;
    const path = req.originalUrl.split("?")[0];
    const message = data?.message || "Request processed";
    const success = data?.success !== false;

    // Log the response
    if (success) {
      logger.info(`${method} ${path} - Success`, {
        statusCode,
        message,
        success: true,
        userId: req.user?._id || req.user?.id,
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.warn(`${method} ${path} - Error`, {
        statusCode,
        message,
        success: false,
        userId: req.user?._id || req.user?.id,
        timestamp: new Date().toISOString(),
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

module.exports = responseLogger;
