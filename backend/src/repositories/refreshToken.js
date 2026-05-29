const RefreshToken = require("../models/refreshToken");

// Handles create refresh token.
const createRefreshToken = async ({
  userId,
  tokenHash,
  jti,
  expiresAt,
  createdByIp,
  userAgent,
}) => {
  return RefreshToken.create({
    userId,
    tokenHash,
    jti,
    expiresAt,
    createdByIp: createdByIp || null,
    userAgent: userAgent || null,
  });
};

// Handles find refresh token by hash.
const findRefreshTokenByHash = async (tokenHash) => {
  return RefreshToken.findOne({ tokenHash });
};

// Handles revoke refresh token by hash.
const revokeRefreshToken = async (tokenHash, replacedByToken = null) => {
  return RefreshToken.updateOne(
    { tokenHash, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        replacedByToken,
      },
    }
  );
};

// Handles replace refresh token.
const replaceRefreshToken = async ({
  oldTokenHash,
  replacedByToken,
  newToken,
}) => {
  await revokeRefreshToken(oldTokenHash, replacedByToken);
  return createRefreshToken(newToken);
};

// Handles revoke all user tokens.
const revokeAllForUser = async (userId) => {
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
  findRefreshTokenByHash,
  revokeRefreshToken,
  replaceRefreshToken,
  revokeAllForUser,
};
