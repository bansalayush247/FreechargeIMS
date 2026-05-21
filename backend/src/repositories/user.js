const User = require("../models/user");

const findActiveUserByEmailWithPassword = async (email) => {
  return User.findOne({
    email,
    isDeleted: false,
    isActive: true,
  }).select("+password");
};

const findActiveUserById = async (userId) => {
  return User.findOne({
    _id: userId,
    isDeleted: false,
    isActive: true,
  }).lean();
};

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

const createUser = async (userData) => {
  return User.create(userData);
};

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

