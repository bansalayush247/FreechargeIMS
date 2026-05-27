const {
  resolveErrorByMessageAndStatus,
} = require("../constants/error");

class AppError extends Error {

  constructor(message, statusCode = 500, errorCode = "GEN_001") {

    super(message);

    const resolved = resolveErrorByMessageAndStatus(
      message,
      statusCode
    );

    this.statusCode = resolved?.statusCode || statusCode;
    this.errorCode = resolved?.errorCode || errorCode;

    Error.captureStackTrace(this, this.constructor);

  }

}

module.exports = AppError;
