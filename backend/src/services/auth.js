const AppError = require("../utils/appError");
const { HTTP_STATUS } = require("../constants/http");

const {
  findActiveUserByEmailWithPassword,
  updateLastLoginAt,
  createUser,
  findUserByEmail,
  findActiveUserById,
  findUserByEmployeeId,
} = require("../repositories/user");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  getRefreshExpiryDate,
} = require("./auth.tokens");

const {
  createRefreshToken,
  revokeRefreshToken,
  replaceRefreshToken,
  revokeAllForUser,
} = require("../repositories/refreshToken");

// Handles generate tokens.
const generateTokens = async (user, ipAddress, userAgent) => {
  const accessToken = generateAccessToken(user);
  const { token: refreshToken, jti } = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);

  await createRefreshToken({
    userId: user._id,
    tokenHash,
    jti,
    expiresAt: getRefreshExpiryDate(),
    createdByIp: ipAddress,
    userAgent,
  });

  return { accessToken, refreshToken };
};

// Handles login user.
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

  return { user: userResponse, ...tokens };
};

// Handles signup user.
const signupUser = async (userData, ipAddress, userAgent) => {
  const existingUser = await findUserByEmail(userData.email);
  if (existingUser) {
    throw new AppError("Email already registered", HTTP_STATUS.CONFLICT);
  }

  const existingEmployee = await findUserByEmployeeId(userData.employeeId);
  if (existingEmployee) {
    throw new AppError("Employee ID already registered", HTTP_STATUS.CONFLICT);
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

  return { user: userResponse, ...tokens };
};

// Handles refresh access token.
const refreshAccessToken = async (refreshToken, ipAddress, userAgent) => {
  const tokenResult = await verifyRefreshToken(refreshToken);

  if (tokenResult.error) {
    if (tokenResult.isReuseDetected && tokenResult.userId) {
      await revokeAllForUser(tokenResult.userId);
    }
    throw new AppError(tokenResult.error, HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await findActiveUserById(tokenResult.userId);
  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.UNAUTHORIZED);
  }

  const accessToken = generateAccessToken(user);
  const { token: newRefreshToken, jti: newJti } = generateRefreshToken();
  const newRefreshHash = hashRefreshToken(newRefreshToken);

  await replaceRefreshToken({
    oldTokenHash: tokenResult.tokenHash,
    replacedByToken: newJti,
    newToken: {
      userId: user._id,
      tokenHash: newRefreshHash,
      jti: newJti,
      expiresAt: getRefreshExpiryDate(),
      createdByIp: ipAddress,
      userAgent,
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
};

// Handles logout user.
const logoutUser = async (refreshToken) => {
  const tokenHash = hashRefreshToken(refreshToken);
  await revokeRefreshToken(tokenHash);
};

module.exports = {
  loginUser,
  signupUser,
  refreshAccessToken,
  logoutUser,
};
