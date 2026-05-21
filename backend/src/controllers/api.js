const asyncHandler = require("../utils/asyncHandler");

// Handles get api status.
const getApiStatus = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "API v1 working",
  });
});

module.exports = { getApiStatus };
