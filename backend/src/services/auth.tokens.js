const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Handles generate access token.
const generateAccessToken = (user) => {
  const privateKey = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      userType: user.userType,
    },
    privateKey,
    {
      algorithm: "RS256",
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m",
    }
  );
};

// Handles generate refresh token.
const generateRefreshToken = (user) => {
  const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET || "refresh-secret-key";

  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      type: "refresh",
    },
    refreshTokenSecret,
    {
      algorithm: "HS256",
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "7d",
    }
  );
};

// Handles verify access token.
const verifyAccessToken = (token) => {
  const publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, "\n");

  try {
    return { decoded: jwt.verify(token, publicKey, { algorithms: ["RS256"] }) };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return { error: "Token expired" };
    }
    return { error: "Invalid token" };
  }
};

// Handles verify refresh token.
const verifyRefreshToken = (token) => {
  const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET || "refresh-secret-key";

  try {
    return { decoded: jwt.verify(token, refreshTokenSecret, { algorithms: ["HS256"] }) };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return { error: "Token expired" };
    }
    return { error: "Invalid token" };
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};