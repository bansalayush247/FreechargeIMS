const logger = require("../config/logger");

function errorMiddleware(err, req, res, next) {

  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl
  });

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];

    return res.status(409).json({
      success: false,
      message: `${field} already exists`
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
}

module.exports = errorMiddleware;