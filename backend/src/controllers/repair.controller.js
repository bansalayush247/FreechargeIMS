const repairService = require("../services/repair.service");

const asyncHandler = require("../utils/asyncHandler");

const {
  createRepairSchema,
  updateRepairSchema,
  completeRepairSchema,
  cancelRepairSchema,
  getRepairsSchema,
} = require("../validators/repair.validation");

const createRepair = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } =
    createRepairSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const repair = await repairService.createRepair(
    value,
    userId,
    {
      spaceId: req.headers["x-space-id"],
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    }
  );

  return res.status(201).json({
    success: true,
    message: "Repair request created successfully",
    data: repair,
  });
});

const getRepairs = asyncHandler(async (req, res) => {
  const { error, value } =
    getRepairsSchema.validate({
      ...req.query,
      spaceId:
        req.query.spaceId ||
        req.headers["x-space-id"],
    });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const repairs = await repairService.getRepairs(value);

  return res.status(200).json({
    success: true,
    message: "Repair requests fetched successfully",
    data: repairs,
  });
});

const getRepairById = asyncHandler(async (req, res) => {
  const repair = await repairService.getRepairById(
    req.params.id
  );

  return res.status(200).json({
    success: true,
    message: "Repair request fetched successfully",
    data: repair,
  });
});

const updateRepair = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } =
    updateRepairSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const repair = await repairService.updateRepair(
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
    message: "Repair request updated successfully",
    data: repair,
  });
});

const completeRepair = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } =
    completeRepairSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const repair = await repairService.completeRepair(
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
    message: "Repair request completed successfully",
    data: repair,
  });
});

const cancelRepair = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { error, value } =
    cancelRepairSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const repair = await repairService.cancelRepair(
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
    message: "Repair request cancelled successfully",
    data: repair,
  });
});

module.exports = {
  createRepair,
  getRepairs,
  getRepairById,
  updateRepair,
  completeRepair,
  cancelRepair,
};
