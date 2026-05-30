const Joi = require("joi");
const { SIGNUP_USER_TYPES } = require("../constants/user");

const passwordPolicy = Joi.string()
  .min(8)
  .max(72)
  .pattern(/[a-z]/)
  .pattern(/[A-Z]/)
  .pattern(/[0-9]/)
  .pattern(/[^A-Za-z0-9]/)
  .pattern(/^\S+$/)
  .messages({
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password must be at most 72 characters long",
    "string.pattern.base":
      "Password must include uppercase, lowercase, number, special character, and no spaces",
  });

const loginValidation = Joi.object({
  email: Joi.string().trim().lowercase().email().max(254).required(),
  password: Joi.string().min(8).required(),
});

const signupValidation = Joi.object({
  email: Joi.string().trim().lowercase().email().max(254).required(),
  password: passwordPolicy.required(),
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().allow("", null),
  employeeId: Joi.string().trim().required(),
  userType: Joi.string()
    .valid(...Object.values(SIGNUP_USER_TYPES))
    .required(),
});

module.exports = {
  loginValidation,
  signupValidation,
};

