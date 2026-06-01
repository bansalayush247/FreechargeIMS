const AppError = require("../utils/appError");

const ALLOWED_ENVIRONMENTS = new Set(["development", "local", "test"]);

const devOnly = (req, res, next) => {
  const nodeEnv = process.env.NODE_ENV || "development";

  if (!ALLOWED_ENVIRONMENTS.has(nodeEnv)) {
    return next(new AppError("Development seed APIs are disabled", 404));
  }

  return next();
};

module.exports = devOnly;
