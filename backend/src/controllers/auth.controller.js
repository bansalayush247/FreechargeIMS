const asyncHandler = require("../utils/asyncHandler");

const { loginUser } = require("../services/auth.service");

const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

const me = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
});

module.exports = {
  login,
  me,
};