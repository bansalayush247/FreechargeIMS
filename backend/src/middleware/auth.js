const AppError = require("../utils/appError");

const { HTTP_STATUS } = require("../constants/http");

const { findActiveUserById } = require("../repositories/user");

const { verifyAccessToken } = require("../services/auth.tokens");

const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError("Unauthorized access", HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authorization.split(" ")[1];

    const tokenResult = verifyAccessToken(token);

    if (tokenResult.error) {
      throw new AppError(tokenResult.error, HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await findActiveUserById(tokenResult.decoded.userId);

    if (!user) {
      throw new AppError("Unauthorized access", HTTP_STATUS.UNAUTHORIZED);
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;

