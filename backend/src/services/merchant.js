const merchantRepository = require("../repositories/merchant");
const AppError = require("../utils/appError");

const createMerchant = async ({ body, userId, spaceId }) => {
  if (!spaceId) {
    throw new AppError("Space ID is required", 400);
  }

  const existing = await merchantRepository.findBySpaceAndCode(
    spaceId,
    body.merchantCode
  );

  if (existing) {
    throw new AppError("Merchant code already exists in this space", 400);
  }

  return merchantRepository.create({
    ...body,
    spaceId,
    createdBy: userId,
    updatedBy: userId,
  });
};

const getMerchants = async (filters) => merchantRepository.paginate(filters);

const getMerchantById = async (id, spaceId) => {
  const merchant = await merchantRepository.findById(id);

  if (!merchant || String(merchant.spaceId) !== String(spaceId)) {
    throw new AppError("Merchant not found", 404);
  }

  return merchant;
};

const updateMerchant = async ({ merchantId, body, userId, spaceId }) => {
  await getMerchantById(merchantId, spaceId);

  if (body.merchantCode) {
    const existing = await merchantRepository.findBySpaceAndCode(
      spaceId,
      body.merchantCode
    );

    if (existing && String(existing._id) !== String(merchantId)) {
      throw new AppError("Merchant code already exists in this space", 400);
    }
  }

  return merchantRepository.updateById(merchantId, {
    ...body,
    updatedBy: userId,
  });
};

const deleteMerchant = async ({ merchantId, userId, spaceId }) => {
  await getMerchantById(merchantId, spaceId);

  return merchantRepository.updateById(merchantId, {
    isDeleted: true,
    isActive: false,
    updatedBy: userId,
  });
};

module.exports = {
  createMerchant,
  getMerchants,
  getMerchantById,
  updateMerchant,
  deleteMerchant,
};
