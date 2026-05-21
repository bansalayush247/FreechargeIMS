const AppError = require("../utils/appError");

const { HTTP_STATUS } = require("../constants/http");
const { USER_TYPES } = require("../constants/user");

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


