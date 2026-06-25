const { AsyncLocalStorage } = require("async_hooks");
const { randomUUID } = require("crypto");

const { sanitizeForLogging } = require("../utils/logSanitizer");
const logger = require("../config/logger");
const asyncLocalStorage = new AsyncLocalStorage();
const GUEST_USER_ID = "GUEST";

const normalizeId = (value, fallback) => {
  if (Array.isArray(value)) {
    return normalizeId(value[0], fallback);
  }

  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
};

const getRequestContext = () => asyncLocalStorage.getStore();

const setRequestContext = (values) => {
  const store = getRequestContext();

  if (store) {
    Object.assign(store, values);
  }
};

const setContextUser = (user) => {
  const userId = user?._id || user?.id || user?.userId;
  setRequestContext({ userId: normalizeId(userId, GUEST_USER_ID) });
};

const contextLogger = (req, res, next) => {
  const requestId = normalizeId(
    req.get("x-request-id") || req.get("x-trace-id"),
    randomUUID()
  );
  
  // Storage initialized with tracing keys and backend identifier
  const context = {
    requestId,
    userId: GUEST_USER_ID,
    source: "backend",
  };
  
  const startedAt = process.hrtime.bigint();
  let responseLogged = false;

  asyncLocalStorage.run(context, () => {
    const originalEnd = res.end;
    let requestSnapshot;

    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);

    res.end = function (...args) {
      requestSnapshot = {
        method: req.method,
        path: req.originalUrl.split("?")[0],
        route: req.route?.path,
        query: sanitizeForLogging(req.query),
        params: sanitizeForLogging(req.params),
        body: sanitizeForLogging(req.body),
      };

      return originalEnd.apply(this, args);
    };

    const logResponse = (aborted = false) => {
      if (responseLogged) {
        return;
      }

      responseLogged = true;
      setContextUser(req.user);

      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      const metadata = {
        event: "http.response",
        request: requestSnapshot || {
          method: req.method,
          path: req.originalUrl.split("?")[0],
          route: req.route?.path,
          query: sanitizeForLogging(req.query),
          params: sanitizeForLogging(req.params),
          body: sanitizeForLogging(req.body),
        },
        response: {
          statusCode: res.statusCode,
          durationMs: Number(durationMs.toFixed(3)),
          aborted,
        },
      };
      const message = `HTTP ${req.method} ${req.originalUrl.split("?")[0]} ${res.statusCode}`;

      if (aborted || res.statusCode >= 500) {
        logger.error(message, metadata);
      } else if (res.statusCode >= 400) {
        logger.warn(message, metadata);
      } else {
        logger.info(message, metadata);
      }
    };

    res.once("finish", () => logResponse(false));
    res.once("close", () => {
      if (!res.writableFinished) {
        logResponse(true);
      }
    });

    next();
  });
};

const requestInputLogger = (req, res, next) => {

  logger.info("HTTP request received", {
    event: "http.request",
    request: {
      method: req.method,
      path: req.originalUrl.split("?")[0],
      query: sanitizeForLogging(req.query),
      body: sanitizeForLogging(req.body),
      ip: req.ip,
      userAgent: req.get("user-agent"),
    },
  });

  next();
};

module.exports = {
  asyncLocalStorage,
  contextLogger,
  getRequestContext,
  requestInputLogger,
  setContextUser,
  setRequestContext,
};