const mongoose = require("mongoose");

const casbinPolicySchema = new mongoose.Schema(
  {
    ptype: { type: String, required: true, index: true },
    v0: { type: String, default: "" },
    v1: { type: String, default: "" },
    v2: { type: String, default: "" },
    v3: { type: String, default: "" },
    v4: { type: String, default: "" },
    v5: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

casbinPolicySchema.index(
  { ptype: 1, v0: 1, v1: 1, v2: 1, v3: 1, v4: 1, v5: 1 },
  { unique: true, name: "uniq_casbin_policy_rule" }
);

module.exports = mongoose.model("CasbinPolicy", casbinPolicySchema);
