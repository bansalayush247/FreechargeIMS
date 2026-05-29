const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

process.env.JWT_PRIVATE_KEY = privateKey.export({ type: "pkcs1", format: "pem" });
process.env.JWT_PUBLIC_KEY = publicKey.export({ type: "pkcs1", format: "pem" });
process.env.ACCESS_TOKEN_EXPIRES = "10m";
process.env.REFRESH_TOKEN_HASH_SECRET = "test-refresh-secret";
process.env.JWT_ISSUER = "freecharge-ims";
process.env.JWT_AUDIENCE = "freecharge-ims-api";

const tokenModulePath = require.resolve("../../src/services/auth.tokens");
delete require.cache[tokenModulePath];
const { generateAccessToken, verifyAccessToken } = require("../../src/services/auth.tokens");

test("generateAccessToken/verifyAccessToken round-trip", () => {
  const token = generateAccessToken({ _id: "507f191e810c19729de860ea", userType: "ADMIN" });
  const verified = verifyAccessToken(token);

  assert.equal(verified.error, undefined);
  assert.equal(verified.decoded.sub, "507f191e810c19729de860ea");
  assert.equal(verified.decoded.iss, "freecharge-ims");
  assert.equal(verified.decoded.aud, "freecharge-ims-api");
  assert.ok(verified.decoded.iat);
  assert.ok(verified.decoded.exp);
  assert.ok(verified.decoded.jti);
});

test("verifyAccessToken rejects wrong algorithm", () => {
  const badToken = jwt.sign({ sub: "u1" }, "hs-secret", { algorithm: "HS256" });
  const verified = verifyAccessToken(badToken);
  assert.equal(verified.error, "Invalid token");
});

test("verifyAccessToken rejects token with missing required claims", () => {
  const rawToken = jwt.sign(
    {},
    process.env.JWT_PRIVATE_KEY,
    {
      algorithm: "RS256",
      expiresIn: "10m",
      issuer: "freecharge-ims",
      audience: "freecharge-ims-api",
    }
  );
  const verified = verifyAccessToken(rawToken);
  assert.equal(verified.error, "Invalid token");
});
