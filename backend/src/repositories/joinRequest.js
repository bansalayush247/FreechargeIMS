const JoinRequest = require("../models/joinRequest");

const create = async (payload) => {
  return JoinRequest.create(payload);
};

const findById = async (id) => {
  return JoinRequest.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("userId", "firstName lastName email employeeId")
    .lean();
};

const findByUserAndSpace = async (userId, spaceId) => {
  return JoinRequest.findOne({
    userId,
    spaceId,
    isDeleted: false,
  }).lean();
};

const updateById = async (id, payload) => {
  return JoinRequest.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { returnDocument: "after" }
  ).lean();
};

const paginate = async (filters) => {
  const { page, limit, spaceId, userId, status } = filters;
  const skip = (page - 1) * limit;

  const query = { isDeleted: false };

  if (spaceId) query.spaceId = spaceId;
  if (userId) query.userId = userId;
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    JoinRequest.find(query)
      .populate("userId", "firstName lastName email employeeId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    JoinRequest.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  create,
  findById,
  findByUserAndSpace,
  updateById,
  paginate,
};
