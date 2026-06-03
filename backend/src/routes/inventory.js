const express = require("express");

const inventoryController = require("../controllers/inventory");

const authMiddleware = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateSpaceId = require("../middleware/validateSpaceId");

const { INVENTORY_PERMISSIONS } = require("../constants/inventory");
const ROUTES = require("../constants/routes");

const router = express.Router();

router.get(ROUTES.INVENTORY_ROUTES.ASSETS, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getInventoryItems);
router.get(ROUTES.INVENTORY_ROUTES.STOCKS, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getInventoryStocks);
router.get(ROUTES.INVENTORY_ROUTES.LOW_STOCK, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getLowStockInventoryStocks);
router.get(ROUTES.INVENTORY_ROUTES.OUT_OF_STOCK, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getOutOfStockInventoryStocks);
router.get(ROUTES.INVENTORY_ROUTES.PROCUREMENT_REQUIRED, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getProcurementRequiredInventoryStocks);
router.get(ROUTES.INVENTORY_ROUTES.STOCK_BY_PRODUCT_ID, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getInventoryStockByProductId);
router.post(ROUTES.INVENTORY_ROUTES.ADJUST_STOCK, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.UPDATE_INVENTORY), (req, _res, next) => {
  req.body.productId = req.params.productId;
  next();
}, inventoryController.adjustInventoryStock);
router.get(ROUTES.INVENTORY_ROUTES.ASSET_BY_ID, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getInventoryAssetById);
router.post(ROUTES.INVENTORY_ROUTES.CREATE, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.CREATE_INVENTORY), inventoryController.createInventoryItem);
router.get(ROUTES.INVENTORY_ROUTES.LIST, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getInventoryItems);
router.get(ROUTES.INVENTORY_ROUTES.QRCODE, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getInventoryItemQrCode);
router.get(ROUTES.INVENTORY_ROUTES.GET_BY_ID, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.VIEW_INVENTORY), inventoryController.getInventoryItemById);
router.patch(ROUTES.INVENTORY_ROUTES.UPDATE, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.UPDATE_INVENTORY), inventoryController.updateInventoryItem);
router.delete(ROUTES.INVENTORY_ROUTES.DELETE, authMiddleware, validateSpaceId, authorize(INVENTORY_PERMISSIONS.DELETE_INVENTORY), inventoryController.deleteInventoryItem);

module.exports = router;
