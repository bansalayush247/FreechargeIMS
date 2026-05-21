const express = require("express");

const { login, me, signup, refresh, logout } = require("../controllers/auth");

const authMiddleware = require("../middleware/auth");

const validate = require("../middleware/validate");

const { loginValidation, signupValidation } = require("../validators/auth");

const ROUTES = require("../constants/routes");

const router = express.Router();

router.post(
  ROUTES.AUTH.SIGNUP,
  validate(signupValidation),
  signup
);

router.post(
  ROUTES.AUTH.LOGIN,
  validate(loginValidation),
  login
);

router.post(
  ROUTES.AUTH.REFRESH,
  refresh
);

router.post(
  ROUTES.AUTH.LOGOUT,
  authMiddleware,
  logout
);

router.get(
  ROUTES.AUTH.ME,
  authMiddleware,
  me
);

module.exports = router;