const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
  findRefreshTokenByHash,
} = require("../repositories/refreshToken");

const TOKEN_ISSUER = process.env.JWT_ISSUER || "freecharge-ims";
const TOKEN_AUDIENCE = process.env.JWT_AUDIENCE || "freecharge-ims-api";

const getRequiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

const parseDurationToMs = (value, fallbackMs) => {
  if (!value) {
    return fallbackMs;
  }
  const parsed = String(value).trim();
  const match = parsed.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return fallbackMs;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "s") return amount * 1000;
  if (unit === "m") return amount * 60 * 1000;
  if (unit === "h") return amount * 60 * 60 * 1000;
  return amount * 24 * 60 * 60 * 1000;
};

const getRefreshExpiryDate = () => {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES || "7d";
  const expiryMs = parseDurationToMs(expiresIn, 7 * 24 * 60 * 60 * 1000);
  return new Date(Date.now() + expiryMs);
};

const hashRefreshToken = (token) => {
  const secret = getRequiredEnv("REFRESH_TOKEN_HASH_SECRET");
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
};

// Handles generate access token.
const generateAccessToken = (user) => {
  const privateKey = getRequiredEnv("JWT_PRIVATE_KEY").replace(/\\n/g, "\n");
  const jwtid = crypto.randomBytes(12).toString("hex");

  const signOptions = {
    algorithm: "RS256",
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "10m",
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    jwtid,
  };
  if (process.env.JWT_KEY_ID) {
    signOptions.keyid = process.env.JWT_KEY_ID;
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      scope: user.userType || user.role || "user",
    },
    privateKey,
    signOptions
  );
};

// Handles generate refresh token.
const generateRefreshToken = () => {
  const token = crypto.randomBytes(64).toString("hex");
  const jti = crypto.randomBytes(12).toString("hex");
  return { token, jti };
};

// Handles verify access token.
const verifyAccessToken = (token) => {
  const publicKey = resolveVerificationKey(token);

  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });
    if (!decoded?.sub || !decoded?.jti || !decoded?.iat || !decoded?.exp) {
      return { error: "Invalid token" };
    }
    return { decoded };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return { error: "Token expired" };
    }
    return { error: "Invalid token" };
  }
};

// Handles verify refresh token.
const verifyRefreshToken = async (token) => {
  const tokenHash = hashRefreshToken(token);
  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (!storedToken) {
    return { error: "Invalid token" };
  }

  if (storedToken.isRevoked) {
    return {
      error: "Token reuse detected",
      userId: storedToken.userId,
      isReuseDetected: true,
    };
  }

  if (storedToken.expiresAt <= new Date()) {
    return { error: "Token expired", userId: storedToken.userId };
  }

  return {
    userId: storedToken.userId,
    jti: storedToken.jti,
    tokenHash,
    storedToken,
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashRefreshToken,
  getRefreshExpiryDate,
};
const resolveVerificationKey = (token) => {
  const defaultKey = getRequiredEnv("JWT_PUBLIC_KEY").replace(/\\n/g, "\n");
  const keySetRaw = process.env.JWT_PUBLIC_KEYS;
  if (!keySetRaw) {
    return defaultKey;
  }

  const decoded = jwt.decode(token, { complete: true }) || {};
  const tokenKid = decoded?.header?.kid;
  if (!tokenKid) {
    return defaultKey;
  }

  try {
    const keySet = JSON.parse(keySetRaw);
    const keyByKid = keySet[tokenKid];
    return keyByKid ? String(keyByKid).replace(/\\n/g, "\n") : defaultKey;
  } catch (error) {
    return defaultKey;
  }
};
