const AppError = require("../utils/appError");

const { HTTP_STATUS } = require("../constants/http.constant");

const {
  findActiveUserByEmailWithPassword,
  updateLastLoginAt,
} = require("../repositories/user.repository");

const { generateAccessToken } = require("./auth.tokens");

const loginUser = async ({ email, password }) => {
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

  const token = generateAccessToken(user);

  const userResponse = user.toObject();

  delete userResponse.password;

  return {
    user: userResponse,
    token,
  };
};

module.exports = {
  loginUser,
};