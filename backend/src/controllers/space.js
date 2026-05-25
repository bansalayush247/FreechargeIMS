const spaceService = require("../services/space");

const asyncHandler = require("../utils/asyncHandler");

const {
  createSpaceSchema,
  updateSpaceSchema,
  getSpacesSchema,
} = require("../validators/space");

// Handles get user id.
const getUserId = (req) => req.user._id || req.user.id;

// Handles get request context.
const getRequestContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent"),
});

// Handles create space.
const createSpace = asyncHandler(async (req, res) => {
  const { error, value } = createSpaceSchema.validate(
    req.body
  );

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const space = await spaceService.createSpace(
    value,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(201).json({
    success: true,
    message: "Space created successfully",
    data: space,
  });
});

// Handles get spaces.
const getSpaces = asyncHandler(async (req, res) => {
  const { error, value } = getSpacesSchema.validate(
    req.query
  );

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const spaces = await spaceService.getSpaces(value);

  return res.status(200).json({
    success: true,
    message: "Spaces fetched successfully",
    data: spaces,
  });
});

// Handles get spaces for current user (spaces where user is a member)
const getMySpaces = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "10", 10);

  // use spaceMember repository to find memberships for the current user
  const spaceMemberRepo = require("../repositories/spaceMember");

  const membershipPage = await spaceMemberRepo.paginate({
    page,
    limit,
    userId: req.user._id,
  });

  const spaceIds = (membershipPage.items || []).map((m) => m.spaceId);

  const spaces = await spaceService.getSpaces({
    page: 1,
    limit: spaceIds.length || 1,
    search: undefined,
    isActive: true,
    ids: spaceIds,
  });

  // If spaceService.getSpaces ignores ids, fallback to repository fetch
  // spaceService.getSpaces currently calls repository.paginate which doesn't accept ids,
  // so fetch directly if spaces.items is undefined or empty.
  let items = spaces?.items ?? [];
  if ((!items || items.length === 0) && spaceIds.length) {
    const spaceRepo = require("../repositories/space");
    items = await spaceRepo.findByIds(spaceIds);
  }

  return res.status(200).json({
    success: true,
    message: "User spaces fetched successfully",
    data: {
      items,
      pagination: membershipPage.pagination,
    },
  });
});

// Handles get space by id.
const getSpaceById = asyncHandler(async (req, res) => {
  const space = await spaceService.getSpaceById(
    req.params.id
  );

  return res.status(200).json({
    success: true,
    message: "Space fetched successfully",
    data: space,
  });
});

// Handles update space.
const updateSpace = asyncHandler(async (req, res) => {
  const { error, value } = updateSpaceSchema.validate(
    req.body
  );

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const space = await spaceService.updateSpace(
    req.params.id,
    value,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(200).json({
    success: true,
    message: "Space updated successfully",
    data: space,
  });
});

// Handles delete space.
const deleteSpace = asyncHandler(async (req, res) => {
  const space = await spaceService.deleteSpace(
    req.params.id,
    getUserId(req),
    getRequestContext(req)
  );

  return res.status(200).json({
    success: true,
    message: "Space deleted successfully",
    data: space,
  });
});

module.exports = {
  createSpace,
  getSpaces,
  getMySpaces,
  getSpaceById,
  updateSpace,
  deleteSpace,
};


