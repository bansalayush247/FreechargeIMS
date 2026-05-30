const joinRequestService = require("../services/joinRequest");
const asyncHandler = require("../utils/asyncHandler");
const { createJoinRequestSchema, reviewJoinRequestSchema, getJoinRequestsSchema } = require("../validators/joinRequest");

const createJoinRequest = asyncHandler(async (req, res) => {
  const rawUserId = req.user && (req.user._id || req.user.id);
  const userId = rawUserId && typeof rawUserId.toString === "function" ? rawUserId.toString() : String(rawUserId);
  const { error, value } = createJoinRequestSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const spaceId = req.params.id;
  const userType = req.user?.userType;

  const request = await joinRequestService.createJoinRequest(spaceId, value, userId, userType, {
    spaceId: req.headers["x-space-id"],
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return res.status(201).json({ success: true, message: "Join request created", data: request });
});

const getJoinRequests = asyncHandler(async (req, res) => {
  const { error, value } = getJoinRequestsSchema.validate({ ...req.query, spaceId: req.params.id });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  if (!value.status) {
    value.status = "PENDING";
  }

  const requests = await joinRequestService.getJoinRequests(value);
  return res.status(200).json({ success: true, message: "Join requests fetched", data: requests });
});

const getMyJoinRequests = asyncHandler(async (req, res) => {
  const rawUserId = req.user && (req.user._id || req.user.id);
  const userId = rawUserId && typeof rawUserId.toString === "function" ? rawUserId.toString() : String(rawUserId);
  const { error, value } = getJoinRequestsSchema.validate({
    ...req.query,
    spaceId: req.params.id,
    userId,
  });
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  if (!value.status) {
    value.status = "PENDING";
  }

  const requests = await joinRequestService.getJoinRequests(value);
  return res.status(200).json({ success: true, message: "Join requests fetched", data: requests });
});

const reviewJoinRequest = asyncHandler(async (req, res) => {
  const rawUserId = req.user && (req.user._id || req.user.id);
  const userId = rawUserId && typeof rawUserId.toString === "function" ? rawUserId.toString() : String(rawUserId);
  const { error, value } = reviewJoinRequestSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const spaceId = req.params.id;
  const requestId = req.params.requestId;

  const updated = await joinRequestService.reviewJoinRequest(spaceId, requestId, value, userId, {
    spaceId: req.headers["x-space-id"],
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return res.status(200).json({ success: true, message: "Join request reviewed", data: updated });
});

module.exports = {
  createJoinRequest,
  getJoinRequests,
  getMyJoinRequests,
  reviewJoinRequest,
};
