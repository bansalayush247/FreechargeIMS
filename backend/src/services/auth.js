const AppError = require("../utils/appError");

const { HTTP_STATUS } = require("../constants/http");

const {
  findActiveUserByEmailWithPassword,
  updateLastLoginAt,
  createUser,
  findUserByEmail,
  findActiveUserById,
} = require("../repositories/user");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("./auth.tokens");

const {
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
} = require("../repositories/refreshToken");

const generateTokens = async (user, ipAddress, userAgent) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await createRefreshToken(user._id, refreshToken, ipAddress, userAgent);

  return {
    accessToken,
    refreshToken,
  };
};

const loginUser = async ({ email, password }, ipAddress, userAgent) => {
  const user = await findActiveUserByEmailWithPassword(email);

  if (!user) {
    throw new AppError("Invalid credentials", HTTP_STATUS.UNAUTHORIZED);
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    throw new AppError("Invalid credentials", HTTP_STATUS.UNAUTHORIZED);
  }

  const lastLoginAt = new Date();
  user.lastLoginAt = lastLoginAt;
  await updateLastLoginAt(user._id, lastLoginAt);

  const tokens = await generateTokens(user, ipAddress, userAgent);

  const userResponse = user.toObject();
  delete userResponse.password;

  return {
    user: userResponse,
    ...tokens,
  };
};

const signupUser = async (userData, ipAddress, userAgent) => {
  const existingUser = await findUserByEmail(userData.email);

  if (existingUser) {
    throw new AppError(
      "Email already registered",
      HTTP_STATUS.CONFLICT
    );
  }

  const user = await createUser({
    email: userData.email,
    password: userData.password,
    firstName: userData.firstName,
    lastName: userData.lastName || "",
    employeeId: userData.employeeId,
    userType: userData.userType,
    isActive: true,
  });

  const tokens = await generateTokens(user, ipAddress, userAgent);

  const userResponse = user.toObject();
  delete userResponse.password;

  return {
    user: userResponse,
    ...tokens,
  };
};

const refreshAccessToken = async (refreshToken) => {
  const tokenResult = verifyRefreshToken(refreshToken);

  if (tokenResult.error) {
    throw new AppError(tokenResult.error, HTTP_STATUS.UNAUTHORIZED);
  }

  const storedToken = await findRefreshToken(refreshToken);

  if (!storedToken) {
    throw new AppError("Invalid token", HTTP_STATUS.UNAUTHORIZED);
  }

  if (storedToken.isRevoked) {
    throw new AppError("Token revoked", HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await findActiveUserById(tokenResult.decoded.userId);

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.UNAUTHORIZED);
  }

  const newAccessToken = generateAccessToken(user);

  return {
    accessToken: newAccessToken,
  };
};

const logoutUser = async (refreshToken) => {
  await revokeRefreshToken(refreshToken);
};

module.exports = {
  loginUser,
  signupUser,
  refreshAccessToken,
  logoutUser,
};

