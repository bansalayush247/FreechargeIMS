const mongoose = require("mongoose");

const {
  PRODUCT_ASSET_TYPES,
  PRODUCT_TRACKING_TYPES,
  TRACKING_TYPE_BY_ASSET_TYPE,
} = require("../constants/product");

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true, uppercase: true },

  name: { type: String, required: true, trim: true },

  category: { type: String, required: true, trim: true },

  brand: { type: String, trim: true },

  model: { type: String, trim: true },

  specifications: { type: Object, default: {} },

  imageUrl: { type: String, trim: true, default: "" },

  assetType: { type: String, enum: Object.values(PRODUCT_ASSET_TYPES), required: true },

  trackingType: {
    type: String,
    enum: Object.values(PRODUCT_TRACKING_TYPES),
    required: true,
    default: function defaultTrackingType() {
      return TRACKING_TYPE_BY_ASSET_TYPE[this.assetType] || PRODUCT_TRACKING_TYPES.SERIALIZED;
    },
    index: true,
  },

  minimumStock: { type: Number, default: 0 },

  isTrackable: { type: Boolean, default: true },

  isDeleted: { type: Boolean, default: false, index: true },

  deletedAt: { type: Date, default: null },

  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

productSchema.index({ sku: 1 }, {
  unique: true,
});

productSchema.index({ category: 1 });
productSchema.index({ trackingType: 1, isDeleted: 1 });

module.exports = mongoose.model("Product", productSchema);

