const RefreshToken = require("../models/refreshToken");

const createRefreshToken = async (userId, token, ipAddress, userAgent) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  return RefreshToken.create({
    userId,
    token,
    expiresAt,
    ipAddress,
    userAgent,
  });
};

const findRefreshToken = async (token) => {
  return RefreshToken.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
};

const revokeRefreshToken = async (token) => {
  return RefreshToken.updateOne(
    { token },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    }
  );
};

const revokeAllUserTokens = async (userId) => {
  return RefreshToken.updateMany(
    { userId, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    }
  );
};

module.exports = {
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};


