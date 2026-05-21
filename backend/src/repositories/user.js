const User = require("../models/user");

// Handles find active user by email with password.
const findActiveUserByEmailWithPassword = async (email) => {
  return User.findOne({
    email,
    isDeleted: false,
    isActive: true,
  }).select("+password");
};

// Handles find active user by id.
const findActiveUserById = async (userId) => {
  return User.findOne({
    _id: userId,
    isDeleted: false,
    isActive: true,
  }).lean();
};

// Handles update last login at.
const updateLastLoginAt = async (userId, lastLoginAt) => {
  return User.updateOne(
    {
      _id: userId,
      isDeleted: false,
      isActive: true,
    },
    {
      $set: {
        lastLoginAt,
      },
    }
  );
};

// Handles create user.
const createUser = async (userData) => {
  return User.create(userData);
};

// Handles find user by email.
const findUserByEmail = async (email) => {
  return User.findOne({
    email,
    isDeleted: false,
  });
};

module.exports = {
  findActiveUserByEmailWithPassword,
  findActiveUserById,
  updateLastLoginAt,
  createUser,
  findUserByEmail,
};

