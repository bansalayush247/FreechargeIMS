const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

process.env.JWT_PRIVATE_KEY = privateKey.export({ type: "pkcs1", format: "pem" });
process.env.JWT_PUBLIC_KEY = publicKey.export({ type: "pkcs1", format: "pem" });
process.env.ACCESS_TOKEN_EXPIRES = "10m";
process.env.REFRESH_TOKEN_EXPIRES = "7d";
process.env.REFRESH_TOKEN_HASH_SECRET = "integration-refresh-secret";
process.env.JWT_ISSUER = "freecharge-ims";
process.env.JWT_AUDIENCE = "freecharge-ims-api";

const refreshTokens = [];

const userDoc = {
  _id: "507f191e810c19729de860ea",
  email: "user@example.com",
  userType: "ADMIN",
  comparePassword: async (password) => password === "Valid@123",
  toObject() {
    return {
      _id: this._id,
      email: this.email,
      userType: this.userType,
      password: "hashed",
    };
  },
};

const userRepoMock = {
  findActiveUserByEmailWithPassword: async (email) => (email === "user@example.com" ? userDoc : null),
  updateLastLoginAt: async () => ({}),
  createUser: async () => userDoc,
  findUserByEmail: async () => null,
  findUserByEmployeeId: async () => null,
  findActiveUserById: async (userId) => (String(userId) === userDoc._id ? userDoc.toObject() : null),
};

const refreshRepoMock = {
  createRefreshToken: async (payload) => {
    refreshTokens.push({
      ...payload,
      isRevoked: false,
      revokedAt: null,
      replacedByToken: null,
    });
    return payload;
  },
  findRefreshTokenByHash: async (tokenHash) => refreshTokens.find((item) => item.tokenHash === tokenHash) || null,
  revokeRefreshToken: async (tokenHash, replacedByToken = null) => {
    const token = refreshTokens.find((item) => item.tokenHash === tokenHash && !item.isRevoked);
    if (token) {
      token.isRevoked = true;
      token.revokedAt = new Date();
      token.replacedByToken = replacedByToken;
    }
    return { modifiedCount: token ? 1 : 0 };
  },
  replaceRefreshToken: async ({ oldTokenHash, replacedByToken, newToken }) => {
    await refreshRepoMock.revokeRefreshToken(oldTokenHash, replacedByToken);
    return refreshRepoMock.createRefreshToken(newToken);
  },
  revokeAllForUser: async (userId) => {
    let count = 0;
    refreshTokens.forEach((item) => {
      if (String(item.userId) === String(userId) && !item.isRevoked) {
        item.isRevoked = true;
        item.revokedAt = new Date();
        count += 1;
      }
    });
    return { modifiedCount: count };
  },
};

const userRepoPath = require.resolve("../../src/repositories/user");
const refreshRepoPath = require.resolve("../../src/repositories/refreshToken");
delete require.cache[userRepoPath];
delete require.cache[refreshRepoPath];
require.cache[userRepoPath] = {
  id: userRepoPath,
  filename: userRepoPath,
  loaded: true,
  exports: userRepoMock,
};
require.cache[refreshRepoPath] = {
  id: refreshRepoPath,
  filename: refreshRepoPath,
  loaded: true,
  exports: refreshRepoMock,
};

const authServicePath = require.resolve("../../src/services/auth");
const tokenServicePath = require.resolve("../../src/services/auth.tokens");
delete require.cache[authServicePath];
delete require.cache[tokenServicePath];

const { loginUser, refreshAccessToken, logoutUser } = require("../../src/services/auth");

test("refresh token rotates and invalidates previous token", async () => {
  refreshTokens.length = 0;
  const login = await loginUser(
    { email: "user@example.com", password: "Valid@123" },
    "127.0.0.1",
    "node-test"
  );
  assert.ok(login.accessToken);
  assert.ok(login.refreshToken);

  const refreshed = await refreshAccessToken(login.refreshToken, "127.0.0.1", "node-test");
  assert.ok(refreshed.accessToken);
  assert.ok(refreshed.refreshToken);
  assert.notEqual(refreshed.refreshToken, login.refreshToken);

  await assert.rejects(
    () => refreshAccessToken(login.refreshToken, "127.0.0.1", "node-test"),
    /Token reuse detected/
  );
});

test("reuse detection revokes all tokens for user", async () => {
  refreshTokens.length = 0;
  const login = await loginUser(
    { email: "user@example.com", password: "Valid@123" },
    "127.0.0.1",
    "node-test"
  );
  const firstRefresh = await refreshAccessToken(login.refreshToken, "127.0.0.1", "node-test");

  await assert.rejects(
    () => refreshAccessToken(login.refreshToken, "127.0.0.1", "node-test"),
    /Token reuse detected/
  );

  await assert.rejects(
    () => refreshAccessToken(firstRefresh.refreshToken, "127.0.0.1", "node-test"),
    /Token reuse detected/
  );
});

test("logout revokes provided refresh token", async () => {
  refreshTokens.length = 0;
  const login = await loginUser(
    { email: "user@example.com", password: "Valid@123" },
    "127.0.0.1",
    "node-test"
  );

  await logoutUser(login.refreshToken);

  await assert.rejects(
    () => refreshAccessToken(login.refreshToken, "127.0.0.1", "node-test"),
    /Token reuse detected/
  );
});
