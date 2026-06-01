const merchantService = require("../services/merchant");
const asyncHandler = require("../utils/asyncHandler");

const createMerchant = asyncHandler(async (req, res) => {
  const merchant = await merchantService.createMerchant({
    body: req.body,
    userId: req.user._id,
    spaceId: req.spaceId,
  });

  return res.status(201).json({
    success: true,
    message: "Merchant created successfully",
    data: merchant,
  });
});

const getMerchants = asyncHandler(async (req, res) => {
  const result = await merchantService.getMerchants({
    spaceId: req.spaceId,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    search: req.query.search || "",
    isActive:
      req.query.isActive === undefined
        ? undefined
        : String(req.query.isActive) === "true",
  });

  return res.status(200).json({ success: true, data: result });
});

const getMerchantById = asyncHandler(async (req, res) => {
  const merchant = await merchantService.getMerchantById(
    req.params.id,
    req.spaceId
  );

  return res.status(200).json({
    success: true,
    data: merchant,
  });
});

const updateMerchant = asyncHandler(async (req, res) => {
  const merchant = await merchantService.updateMerchant({
    merchantId: req.params.id,
    body: req.body,
    userId: req.user._id,
    spaceId: req.spaceId,
  });

  return res.status(200).json({
    success: true,
    message: "Merchant updated successfully",
    data: merchant,
  });
});

const deleteMerchant = asyncHandler(async (req, res) => {
  await merchantService.deleteMerchant({
    merchantId: req.params.id,
    userId: req.user._id,
    spaceId: req.spaceId,
  });

  return res.status(200).json({
    success: true,
    message: "Merchant deleted successfully",
  });
});

module.exports = {
  createMerchant,
  getMerchants,
  getMerchantById,
  updateMerchant,
  deleteMerchant,
};
