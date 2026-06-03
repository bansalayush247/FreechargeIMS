const assetRegistryService = require("../services/assetRegistry");
const asyncHandler = require("../utils/asyncHandler");
const { getAssetRegistrySchema } = require("../validators/assetRegistry");

const getAssetRegistry = asyncHandler(async (req, res) => {
  const { error, value } = getAssetRegistrySchema.validate(req.query);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const result = await assetRegistryService.getAssetRegistry(value, {
    userId: req.user._id || req.user.id,
    spaceId: req.spaceId,
  });

  return res.status(200).json({ success: true, message: "Asset registry fetched successfully", data: result });
});

const getMyAssetRegistry = asyncHandler(async (req, res) => {
  const { error, value } = getAssetRegistrySchema.validate(req.query);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const result = await assetRegistryService.getMyAssetRegistry(value, {
    userId: req.user._id || req.user.id,
    spaceId: req.spaceId,
  });

  return res.status(200).json({ success: true, message: "My asset registry fetched successfully", data: result });
});

const getUserAssetRegistry = asyncHandler(async (req, res) => {
  const { error, value } = getAssetRegistrySchema.validate(req.query);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const result = await assetRegistryService.getUserAssetRegistry(req.params.userId, value, {
    userId: req.user._id || req.user.id,
    spaceId: req.spaceId,
  });

  return res.status(200).json({ success: true, message: "User asset registry fetched successfully", data: result });
});

module.exports = {
  getAssetRegistry,
  getMyAssetRegistry,
  getUserAssetRegistry,
};
