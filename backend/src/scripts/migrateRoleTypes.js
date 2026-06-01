const db = require("../database/db");
const Role = require("../models/role");
const { ROLE_CODES } = require("../constants/role");

const SPACE_BUILTIN_CODES = new Set([ROLE_CODES.SPACE_ADMIN, ROLE_CODES.MEMBER]);
const SYSTEM_CODES = new Set([ROLE_CODES.SUPER_ADMIN]);

const run = async () => {
  await db.connectDB();

  const roles = await Role.find({ isDeleted: false }).select("_id code isSystemRole").lean();
  let updated = 0;

  for (const role of roles) {
    const code = String(role.code || "").toUpperCase();
    let nextType = "custom";

    if (SYSTEM_CODES.has(code) || role.isSystemRole) {
      nextType = "system";
    } else if (SPACE_BUILTIN_CODES.has(code)) {
      nextType = "space_builtin";
    }

    const result = await Role.updateOne({ _id: role._id }, { $set: { type: nextType } });
    if (result.modifiedCount > 0) updated += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Role type migration complete. Updated ${updated} roles.`);
  process.exit(0);
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Role type migration failed", error);
  process.exit(1);
});
