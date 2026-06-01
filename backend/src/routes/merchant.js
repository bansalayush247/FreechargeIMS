const express = require("express");

const router = express.Router();

const merchantController = require("../controllers/merchant");
const authMiddleware = require("../middleware/auth");
const validateSpaceId = require("../middleware/validateSpaceId");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const {
  createMerchantSchema,
  updateMerchantSchema,
} = require("../validators/merchant");
const { PERMISSIONS } = require("../constants/permission");
const ROUTES = require("../constants/routes");

router.post(
  ROUTES.MERCHANT_ROUTES.CREATE,
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.CREATE_MERCHANT),
  validate(createMerchantSchema),
  merchantController.createMerchant
);
router.get(
  ROUTES.MERCHANT_ROUTES.LIST,
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.VIEW_MERCHANT),
  merchantController.getMerchants
);
router.get(
  ROUTES.MERCHANT_ROUTES.GET_BY_ID,
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.VIEW_MERCHANT),
  merchantController.getMerchantById
);
router.patch(
  ROUTES.MERCHANT_ROUTES.UPDATE,
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.UPDATE_MERCHANT),
  validate(updateMerchantSchema),
  merchantController.updateMerchant
);
router.delete(
  ROUTES.MERCHANT_ROUTES.DELETE,
  authMiddleware,
  validateSpaceId,
  authorize(PERMISSIONS.DELETE_MERCHANT),
  merchantController.deleteMerchant
);

module.exports = router;
