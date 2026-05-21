const spaceService = require("../services/space");

const asyncHandler = require("../utils/asyncHandler");

const {
  createSpaceSchema,
  updateSpaceSchema,
  getSpacesSchema,
} = require("../validators/space");

const getUserId = (req) => req.user._id || req.user.id;

const getRequestContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent"),
});

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
  getSpaceById,
  updateSpace,
  deleteSpace,
};


