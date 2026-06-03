const AssetRequestApproval = require("../models/assetRequestApproval");

const create = async (payload) => AssetRequestApproval.create(payload);

const findByAssetRequestId = async (assetRequestId, spaceId) => {
  const query = { assetRequestId };

  if (spaceId) {
    query.spaceId = spaceId;
  }

  return AssetRequestApproval.find(query)
    .populate("approverId", "firstName lastName email employeeId")
    .sort({ actionAt: 1 })
    .lean();
};

module.exports = {
  create,
  findByAssetRequestId,
};
