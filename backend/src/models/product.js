const mongoose = require("mongoose");

const { PRODUCT_ASSET_TYPES } = require("../constants/product");

const productSchema = new mongoose.Schema({
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Space", required: true, index: true },

  sku: { type: String, required: true, trim: true, uppercase: true },

  name: { type: String, required: true, trim: true },

  category: { type: String, required: true, trim: true },

  brand: { type: String, trim: true },

  model: { type: String, trim: true },

  specifications: { type: Object, default: {} },

  assetType: { type: String, enum: Object.values(PRODUCT_ASSET_TYPES), required: true },

  minimumStock: { type: Number, default: 0 },

  isTrackable: { type: Boolean, default: true },

  isDeleted: { type: Boolean, default: false, index: true },

  deletedAt: { type: Date, default: null },

  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

productSchema.index({ spaceId: 1, sku: 1 }, { 
  unique: true, 
  sparse: true, 
  partialFilterExpression: { isDeleted: false } 
});

productSchema.index({ category: 1 });

module.exports = mongoose.model("Product", productSchema);

