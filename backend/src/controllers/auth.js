const asyncHandler = require("../utils/asyncHandler");
const logger = require("../config/logger");
const { loginUser, signupUser, refreshAccessToken, logoutUser } = require("../services/auth");
const { HTTP_STATUS } = require("../constants/http");
const AppError = require("../utils/appError");

const getIpAddress = (req) => {
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
};

const getUserAgent = (req) => {
  return req.get("user-agent") || "Unknown";
};

const login = asyncHandler(async (req, res) => {
  const ipAddress = getIpAddress(req);
  const userAgent = getUserAgent(req);
  const result = await loginUser(req.body, ipAddress, userAgent);

  logger.info("User login successful", {
    email: req.body.email,
    userId: result.user?._id,
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

const signup = asyncHandler(async (req, res) => {
  const ipAddress = getIpAddress(req);
  const userAgent = getUserAgent(req);
  const result = await signupUser(req.body, ipAddress, userAgent);

  logger.info("User signup successful", {
    email: req.body.email,
    userId: result.user?._id,
    timestamp: new Date().toISOString(),
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", HTTP_STATUS.BAD_REQUEST);
  }

  const result = await refreshAccessToken(refreshToken);

  logger.info("Access token refreshed", {
    userId: req.user?._id,
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({
    success: true,
    message: "Access token refreshed",
    data: result,
  });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await logoutUser(refreshToken);
  }

  logger.info("User logout successful", {
    userId: req.user?._id,
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

const me = asyncHandler(async (req, res) => {
  logger.info("Fetched current user", {
    userId: req.user?._id || req.user?.id,
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({
    success: true,
    data: req.user,
  });
});

module.exports = {
  login,
  signup,
  refresh,
  logout,
  me,
};

