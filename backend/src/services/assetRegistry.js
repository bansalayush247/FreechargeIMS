const assetRegistryRepository = require("../repositories/assetRegistry");
const { assertActiveMembership } = require("./permissionResolver");
const AppError = require("../utils/appError");

const getAssetRegistry = async (filters, context = {}) => {
  if (!context.spaceId) throw new AppError("Space ID is required", 400);
  await assertActiveMembership(context.userId, context.spaceId);

  return assetRegistryRepository.paginateBySpace({
    ...filters,
    assignedSpaceId: context.spaceId,
  });
};

const getMyAssetRegistry = async (filters, context = {}) => {
  if (!context.userId) throw new AppError("User ID is required", 400);

  return getAssetRegistry(
    {
      ...filters,
      assignedToUserId: context.userId,
    },
    context
  );
};

const getUserAssetRegistry = async (targetUserId, filters, context = {}) => {
  if (!targetUserId) throw new AppError("Target user ID is required", 400);

  return getAssetRegistry(
    {
      ...filters,
      assignedToUserId: targetUserId,
    },
    context
  );
};

module.exports = {
  getAssetRegistry,
  getMyAssetRegistry,
  getUserAssetRegistry,
};
