const jwt = require("jsonwebtoken");

const AppError = require("../utils/appError");

const { HTTP_STATUS } = require("../constants/http.constant");

const { findActiveUserById } = require("../repositories/user.repository");

const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError("Unauthorized access", HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await findActiveUserById(decoded.userId);

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