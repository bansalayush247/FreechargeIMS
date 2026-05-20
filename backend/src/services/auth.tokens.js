const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      userType: user.userType,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

module.exports = {
  generateAccessToken,
};