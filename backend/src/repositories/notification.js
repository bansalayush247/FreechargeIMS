const Notification = require("../models/notification");

// Handles create notification.
const create = async (payload) => {
  return Notification.create(payload);
};

// Handles find notification by id.
const findById = async (id) => {
  return Notification.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("recipientUserId", "firstName lastName email employeeId")
    .lean();
};

// Handles update notification by id.
const updateById = async (id, payload) => {
  return Notification.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
    },
    payload,
    {
      new: true,
    }
  ).lean();
};

// Handles paginate notifications.
const paginate = async (filters) => {
  const {
    page,
    limit,
    spaceId,
    recipientUserId,
    recipientEmail,
    status,
    type,
    channel,
  } = filters;

  const skip = (page - 1) * limit;

  const query = {
    isDeleted: false,
  };

  if (spaceId) {
    query.spaceId = spaceId;
  }

  if (recipientUserId) {
    query.recipientUserId = recipientUserId;
  }

  if (recipientEmail) {
    query.recipientEmail = recipientEmail;
  }

  if (status) {
    query.status = status;
  }

  if (type) {
    query.type = type;
  }

  if (channel) {
    query.channel = channel;
  }

  const [items, total] = await Promise.all([
    Notification.find(query)
      .populate("recipientUserId", "firstName lastName email employeeId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Notification.countDocuments(query),
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
  updateById,
  paginate,
};
