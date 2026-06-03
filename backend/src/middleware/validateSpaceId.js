const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const { ERRORS } = require("../constants/error");

// Handles validate space id.
const validateSpaceId = (req, res, next) => {
  const spaceId = req.headers["x-space-id"];

  if (!spaceId) {
    throw new AppError(
      ERRORS.SPACE_ID_REQUIRED.message,
      ERRORS.SPACE_ID_REQUIRED.statusCode,
      ERRORS.SPACE_ID_REQUIRED.errorCode
    );
  }

  // Validate if it's a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(spaceId)) {
    throw new AppError(
      ERRORS.INVALID_SPACE_ID_FORMAT.message,
      ERRORS.INVALID_SPACE_ID_FORMAT.statusCode,
      ERRORS.INVALID_SPACE_ID_FORMAT.errorCode
    );
  }

  req.spaceId = spaceId;
  
  next();
};

module.exports = validateSpaceId;


