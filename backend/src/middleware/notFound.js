const AppError = require("../utils/appError");
const { ERRORS } = require("../constants/error");

// Handles not found.
function notFound(req, res, next) {
  next(new AppError(
    `${ERRORS.ROUTE_NOT_FOUND.message} - ${req.originalUrl}`,
    ERRORS.ROUTE_NOT_FOUND.statusCode,
    ERRORS.ROUTE_NOT_FOUND.errorCode
  ));
}

module.exports = notFound;
