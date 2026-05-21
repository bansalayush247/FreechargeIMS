const Joi = require("joi");
const { USER_TYPES } = require("../constants/user");

const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const signupValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().allow("", null),
  employeeId: Joi.string().trim().required(),
  userType: Joi.string()
    .valid(...Object.values(USER_TYPES))
    .required(),
});

module.exports = {
  loginValidation,
  signupValidation,
};

