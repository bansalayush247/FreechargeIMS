const SPACE_CODES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  IT_TEAM: "IT_TEAM",
  WAREHOUSE: "WAREHOUSE",
};

const SPACE_TYPES = {
  EMPLOYEE: "EMPLOYEE",
  MERCHANT: "MERCHANT",
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
  WAREHOUSE: {
    name: "Warehouse Space",
    code: SPACE_CODES.WAREHOUSE,
    description: "Warehouse space for merchant users",
  },
};

module.exports = {
  SPACE_CODES,
  SPACE_TYPES,
  SYSTEM_SPACES,
};
