const mongoose = require("mongoose");

const assetTagCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      trim: true,
      uppercase: true,
    },

    seq: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("AssetTagCounter", assetTagCounterSchema);
