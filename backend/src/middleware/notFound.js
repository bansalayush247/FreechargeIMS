const AppError = require("../utils/appError");

// Handles not found.
function notFound(req, res, next) {
  next(new AppError(`Route not found - ${req.originalUrl}`, 404));
}

module.exports = notFound;