const REQUIRED_ENV = [
  "MONGO_URI",
  "JWT_PRIVATE_KEY",
  "JWT_PUBLIC_KEY",
  "REFRESH_TOKEN_HASH_SECRET",
];

const validateEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};

const getAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

module.exports = {
  validateEnv,
  getAllowedOrigins,
};
