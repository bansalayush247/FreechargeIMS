const warehouseService = require(
  "../services/warehouse"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

const createWarehouse = asyncHandler(
  async (req, res) => {
    const warehouse =
      await warehouseService.createWarehouse({
        body: req.body,
        userId: req.user._id,
        spaceId: req.spaceId,
        context: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Warehouse created successfully",
      data: warehouse,
    });
  }
);

const getWarehouses = asyncHandler(
  async (req, res) => {
    const page = Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const result =
      await warehouseService.getWarehouses({
        spaceId: req.spaceId,
        page,
        limit,
      });

    return res.status(200).json({
      success: true,
      data: result,
    });
  }
);

const updateWarehouse = asyncHandler(
  async (req, res) => {
    const warehouse =
      await warehouseService.updateWarehouse({
        warehouseId: req.params.id,
        body: req.body,
        userId: req.user._id,
        context: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Warehouse updated successfully",
      data: warehouse,
    });
  }
);

const deleteWarehouse = asyncHandler(
  async (req, res) => {
    await warehouseService.deleteWarehouse({
        warehouseId: req.params.id,
        userId: req.user._id,
        context: {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        },
      });

    return res.status(200).json({
      success: true,
      message:
        "Warehouse deleted successfully",
    });
  }
);

module.exports = {
  createWarehouse,
  getWarehouses,
  updateWarehouse,
  deleteWarehouse,
};
