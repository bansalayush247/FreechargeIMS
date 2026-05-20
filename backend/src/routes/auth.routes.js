const express = require("express");

const { login, me } = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

const validate = require("../middleware/validate.middleware");

const { loginValidation } = require("../validators/auth.validation");

const router = express.Router();

router.post(
  "/login",
  validate(loginValidation),
  login
);

router.get(
  "/me",
  authMiddleware,
  me
);

module.exports = router;