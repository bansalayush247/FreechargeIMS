const AssetRequestApproval = require("../models/assetRequestApproval");

const create = async (payload) => AssetRequestApproval.create(payload);

const findByAssetRequestId = async (assetRequestId) => {
  return AssetRequestApproval.find({ assetRequestId })
    .populate("approverId", "firstName lastName email employeeId")
    .sort({ actionAt: 1 })
    .lean();
};

module.exports = {
  create,
  findByAssetRequestId,
};
