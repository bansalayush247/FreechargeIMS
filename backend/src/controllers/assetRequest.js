const assetRequestService = require(
  "../services/assetRequest"
);

const asyncHandler = require("../utils/asyncHandler");

const {
  createAssetRequestSchema,
  approvalSchema,
  rejectionSchema,
  forwardSchema,
  getAssetRequestsSchema,
} = require(
  "../validators/assetRequest"
);

const createAssetRequest = asyncHandler(
  async (req, res) => {
    const userId = req.user._id || req.user.id;
    const { error, value } =
      createAssetRequestSchema.validate(
        req.body
      );

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const request =
      await assetRequestService.createAssetRequest(
        value,
        userId,
        {
          spaceId: req.headers["x-space-id"],
          userType: req.user?.userType,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

    return res.status(201).json({
      success: true,
      message:
        "Asset request created successfully",
      data: request,
    });
  }
);

const getAssetRequests = asyncHandler(
  async (req, res) => {
    const { error, value } =
      getAssetRequestsSchema.validate({
        ...req.query,
        spaceId: req.headers["x-space-id"],
      });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const requests =
      await assetRequestService.getAssetRequests(
        value
      );

    return res.status(200).json({
      success: true,
      message:
        "Asset requests fetched successfully",
      data: requests,
    });
  }
);

const forwardRequest = asyncHandler(
  async (req, res) => {
    const userId = req.user._id || req.user.id;
    const { error, value } =
      forwardSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const request =
      await assetRequestService.forwardRequest(
        req.params.id,
        value,
        userId,
        {
          spaceId: req.headers["x-space-id"],
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

    return res.status(200).json({
      success: true,
      message: "Asset request forwarded",
      data: request,
    });
  }
);

const getAssetRequestById = asyncHandler(
  async (req, res) => {
    const request =
      await assetRequestService.getAssetRequestById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Asset request fetched successfully",
      data: request,
    });
  }
);

const managerApproveRequest = asyncHandler(
  async (req, res) => {
    const userId = req.user._id || req.user.id;
    const { error, value } =
      approvalSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const request =
      await assetRequestService.managerApproveRequest(
        req.params.id,
        value,
        userId,
        {
          spaceId: req.headers["x-space-id"],
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Manager approval completed",
      data: request,
    });
  }
);

const itApproveRequest = asyncHandler(
  async (req, res) => {
    const userId = req.user._id || req.user.id;
    const { error, value } =
      approvalSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const request =
      await assetRequestService.itApproveRequest(
        req.params.id,
        value,
        userId,
        {
          spaceId: req.headers["x-space-id"],
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

    return res.status(200).json({
      success: true,
      message: "IT approval completed",
      data: request,
    });
  }
);

const rejectRequest = asyncHandler(
  async (req, res) => {
    const userId = req.user._id || req.user.id;
    const { error, value } =
      rejectionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const request =
      await assetRequestService.rejectRequest(
        req.params.id,
        value,
        userId,
        {
          spaceId: req.headers["x-space-id"],
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Asset request rejected",
      data: request,
    });
  }
);

const cancelRequest = asyncHandler(
  async (req, res) => {
    const userId = req.user._id || req.user.id;
    const request =
      await assetRequestService.cancelRequest(
        req.params.id,
        userId,
        {
          spaceId: req.headers["x-space-id"],
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Asset request cancelled",
      data: request,
    });
  }
);

module.exports = {
  createAssetRequest,
  getAssetRequests,
  getAssetRequestById,
  managerApproveRequest,
  itApproveRequest,
  rejectRequest,
  cancelRequest,
  forwardRequest,
};
