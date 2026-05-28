const { StatusCodes } = require("http-status-codes");

const buckets = new Map();

const rateLimiter = ({
  windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max = Number(process.env.RATE_LIMIT_MAX || 300),
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;

    if (bucket.count > max) {
      return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        success: false,
        message: "Too many requests",
        errorCode: "RATE_001",
      });
    }

    return next();
  };
};

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, Number(process.env.RATE_LIMIT_CLEANUP_MS || 60000)).unref();

module.exports = rateLimiter;
