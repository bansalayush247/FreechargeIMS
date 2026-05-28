const SPACE_CODES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  IT_TEAM: "IT_TEAM",
};

const SYSTEM_SPACES = {
  SUPER_ADMIN: {
    name: "Super Admin Space",
    code: SPACE_CODES.SUPER_ADMIN,
    description: "System administration space",
  },
  IT_TEAM: {
    name: "IT Team",
    code: SPACE_CODES.IT_TEAM,
    description: "Central IT approval queue space",
  },
};

module.exports = {
  SPACE_CODES,
  SYSTEM_SPACES,
};
