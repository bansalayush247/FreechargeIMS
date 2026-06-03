const asyncHandler = require("../utils/asyncHandler");
const logger = require("../config/logger");
const { loginUser, signupUser, refreshAccessToken, logoutUser } = require("../services/auth");
const { HTTP_STATUS } = require("../constants/http");
const AppError = require("../utils/appError");
const { ERRORS } = require("../constants/error");
const { getAuthzSnapshotByUser } = require("../services/permissionResolver");
const spaceRepository = require("../repositories/space");

const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || "refreshToken";

const parseDurationToMs = (value, fallbackMs) => {
  if (!value) return fallbackMs;
  const match = String(value).trim().match(/^(\d+)([smhd])$/i);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "s") return amount * 1000;
  if (unit === "m") return amount * 60 * 1000;
  if (unit === "h") return amount * 60 * 60 * 1000;
  return amount * 24 * 60 * 60 * 1000;
};

const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax");
  const maxAge = parseDurationToMs(
    process.env.REFRESH_TOKEN_EXPIRES || "7d",
    7 * 24 * 60 * 60 * 1000
  );

  return {
    httpOnly: true,
    secure: isProduction || sameSite === "none",
    sameSite,
    maxAge,
    path: "/auth",
  };
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
    expires: new Date(0),
  });
};

// Handles get ip address.
const getIpAddress = (req) => { return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;};

// Handles get user agent.
const getUserAgent = (req) => { return req.get("user-agent") || "Unknown";};

// Handles login.
const login = asyncHandler(async (req, res) => {
  const ipAddress = getIpAddress(req)
  const userAgent = getUserAgent(req)
  const result = await loginUser(req.body, ipAddress, userAgent);

  setRefreshCookie(res, result.refreshToken);

  logger.info("User login successful", { email: req.body.email, userId: result.user?._id, timestamp: new Date().toISOString() });
  
  return res.status(200).json({ success: true, message: "Login successful", data: result });
});

// Handles signup.
const signup = asyncHandler(async (req, res) => {
  const ipAddress = getIpAddress(req)
  const userAgent = getUserAgent(req)
  const result = await signupUser(req.body, ipAddress, userAgent);
 
  setRefreshCookie(res, result.refreshToken);
 
  logger.info("User signup successful", { email: req.body.email, userId: result.user?._id, timestamp: new Date().toISOString() });
 
  return res.status(HTTP_STATUS.CREATED).json({ success: true, message: "User registered successfully", data: result });
});

// Handles refresh.
const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.cookies?.[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    throw new AppError(
      ERRORS.REFRESH_TOKEN_REQUIRED.message,
      ERRORS.REFRESH_TOKEN_REQUIRED.statusCode,
      ERRORS.REFRESH_TOKEN_REQUIRED.errorCode
    );
  }

  const result = await refreshAccessToken(refreshToken, getIpAddress(req), getUserAgent(req));
  setRefreshCookie(res, result.refreshToken);
  logger.info("Access token refreshed", { userId: req.user?._id, timestamp: new Date().toISOString() });
  return res.status(200).json({ success: true, message: "Access token refreshed", data: result });
});

// Handles logout.
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.cookies?.[REFRESH_COOKIE_NAME];

  if (refreshToken) {
    await logoutUser(refreshToken);
  }
  clearRefreshCookie(res);
  logger.info("User logout successful", { userId: req.user?._id, timestamp: new Date().toISOString() });
  return res.status(200).json({ success: true, message: "Logout successful" });
});

// Handles me.
const me = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const activeSpaceId = req.spaceId || null;
  const snapshot = await getAuthzSnapshotByUser(userId);
  const activeSpace = activeSpaceId
    ? await spaceRepository.findById(activeSpaceId)
    : null;

  logger.info("Fetched current user", { userId: req.user?._id || req.user?.id, timestamp: new Date().toISOString() });
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
      activeSpace,
      memberships: snapshot.memberships,
      rolesBySpace: snapshot.rolesBySpace,
      permissionsBySpace: snapshot.permissionsBySpace,
      isGlobalSuperAdmin: snapshot.isGlobalSuperAdmin,
    },
  });
});

module.exports = {
  login,
  signup,
  refresh,
  logout,
  me,
};
