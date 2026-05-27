const { Helper } = require("casbin");
const CasbinPolicy = require("../models/casbinPolicy");

const toDoc = (ptype, rule = []) => {
  const padded = [...rule, "", "", "", "", "", ""].slice(0, 6);
  return {
    ptype,
    v0: String(padded[0] || ""),
    v1: String(padded[1] || ""),
    v2: String(padded[2] || ""),
    v3: String(padded[3] || ""),
    v4: String(padded[4] || ""),
    v5: String(padded[5] || ""),
  };
};

const toLine = (doc) => {
  const vals = [doc.v0, doc.v1, doc.v2, doc.v3, doc.v4, doc.v5].filter((v) => v !== "");
  return `${doc.ptype}, ${vals.join(", ")}`;
};

class MongoCasbinAdapter {
  async loadPolicy(model) {
    const docs = await CasbinPolicy.find({}).lean();
    docs.forEach((doc) => Helper.loadPolicyLine(toLine(doc), model));
  }

  async savePolicy(model) {
    const docs = [];
    for (const sec of ["p", "g"]) {
      if (!model.model.get(sec)) {
        continue;
      }
      for (const [ptype, assertion] of model.model.get(sec)) {
        for (const rule of assertion.policy) {
          docs.push(toDoc(ptype, rule));
        }
      }
    }

    await CasbinPolicy.deleteMany({});
    if (docs.length) {
      await CasbinPolicy.insertMany(docs, { ordered: false });
    }
    return true;
  }

  async addPolicy(sec, ptype, rule) {
    await CasbinPolicy.updateOne(toDoc(ptype, rule), { $setOnInsert: toDoc(ptype, rule) }, { upsert: true });
  }

  async addPolicies(sec, ptype, rules) {
    if (!rules.length) return;
    const ops = rules.map((rule) => {
      const doc = toDoc(ptype, rule);
      return {
        updateOne: {
          filter: doc,
          update: { $setOnInsert: doc },
          upsert: true,
        },
      };
    });
    await CasbinPolicy.bulkWrite(ops, { ordered: false });
  }

  async removePolicy(sec, ptype, rule) {
    await CasbinPolicy.deleteOne(toDoc(ptype, rule));
  }

  async removePolicies(sec, ptype, rules) {
    if (!rules.length) return;
    await CasbinPolicy.deleteMany({
      $or: rules.map((rule) => toDoc(ptype, rule)),
    });
  }

  async removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues) {
    const filter = { ptype };
    fieldValues.forEach((value, idx) => {
      if (value !== undefined && value !== "") {
        filter[`v${fieldIndex + idx}`] = value;
      }
    });
    await CasbinPolicy.deleteMany(filter);
  }
}

module.exports = MongoCasbinAdapter;
