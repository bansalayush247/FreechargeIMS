const AppError = require("../utils/appError");
const { ERRORS } = require("../constants/error");

const { HTTP_STATUS } = require("../constants/http");

const { findActiveUserById } = require("../repositories/user");

const { verifyAccessToken } = require("../services/auth.tokens");
const { setContextUser } = require("./contextLogger");

// Handles auth middleware.
const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError(
        ERRORS.UNAUTHORIZED.message,
        ERRORS.UNAUTHORIZED.statusCode,
        ERRORS.UNAUTHORIZED.errorCode
      );
    }

    const token = authorization.split(" ")[1];

    const tokenResult = verifyAccessToken(token);

    if (tokenResult.error) {
      throw new AppError(tokenResult.error, HTTP_STATUS.UNAUTHORIZED);
    }

    const userId = tokenResult.decoded.sub || tokenResult.decoded.userId;
    const user = await findActiveUserById(userId);

    if (!user) {
      throw new AppError(
        ERRORS.UNAUTHORIZED.message,
        ERRORS.UNAUTHORIZED.statusCode,
        ERRORS.UNAUTHORIZED.errorCode
      );
    }

    req.user = user;
    setContextUser(user);

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;

