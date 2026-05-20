const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const { HTTP_STATUS } = require("../constants/http.constant");

const validateSpaceId = (req, res, next) => {
  const spaceId = req.headers["x-space-id"];

  if (!spaceId) {
    throw new AppError("Space ID is required", HTTP_STATUS.BAD_REQUEST);
  }

  // Validate if it's a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(spaceId)) {
    throw new AppError("Invalid Space ID format", HTTP_STATUS.BAD_REQUEST);
  }

  // Convert to ObjectId
  req.spaceId = new mongoose.Types.ObjectId(spaceId);
  next();
};

module.exports = validateSpaceId;
