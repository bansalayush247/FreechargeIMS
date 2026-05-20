const AppError = require("../utils/appError");

const { HTTP_STATUS } = require("../constants/http.constant");
const { USER_TYPES } = require("../constants/user.constant");

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.userType !== USER_TYPES.ADMIN) {
    throw new AppError(
      "Admin access required",
      HTTP_STATUS.FORBIDDEN
    );
  }

  next();
};

module.exports = requireAdmin;
