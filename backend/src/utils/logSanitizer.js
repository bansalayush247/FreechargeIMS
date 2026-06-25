const REDACTED = "[REDACTED]";
const SENSITIVE_KEY_PATTERN = /(?:password|passcode|token|authorization|cookie|secret|api[-_]?key|credit[-_]?card|card[-_]?number|cvv|cvc)/i;
const SENSITIVE_QUERY_PATTERN = /([?&](?:password|passcode|token|authorization|secret|api[-_]?key|credit[-_]?card|card[-_]?number|cvv|cvc)=)[^&\s]*/gi;
const BEARER_TOKEN_PATTERN = /(bearer\s+)[^\s,;]+/gi;

const sanitizeString = (value) => value
  .replace(SENSITIVE_QUERY_PATTERN, `$1${REDACTED}`)
  .replace(BEARER_TOKEN_PATTERN, `$1${REDACTED}`);

const sanitizeForLogging = (value, seen = new WeakSet()) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (typeof value !== "object") {
    return value;
  }

  if (Buffer.isBuffer(value)) {
    return `[Buffer ${value.length} bytes]`;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  if (typeof value.toJSON === "function") {
    const jsonValue = value.toJSON();

    if (jsonValue !== value) {
      return sanitizeForLogging(jsonValue, seen);
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLogging(item, seen));
  }

  return Object.entries(value).reduce((sanitized, [key, nestedValue]) => {
    sanitized[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? REDACTED
      : sanitizeForLogging(nestedValue, seen);
    return sanitized;
  }, {});
};

module.exports = {
  REDACTED,
  sanitizeForLogging,
  sanitizeString,
};
