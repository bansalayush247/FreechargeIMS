const INVENTORY_STATUS = {
  IN_STOCK: "IN_STOCK",
  ASSIGNED: "ASSIGNED",
  REPAIR: "REPAIR",
  LOST: "LOST",
  DAMAGED: "DAMAGED",
  DISPOSED: "DISPOSED",

  // Legacy aliases kept for backward compatibility.
  AVAILABLE: "IN_STOCK",
  IN_REPAIR: "REPAIR",
  RETIRED: "DISPOSED",
};

const LEGACY_INVENTORY_STATUS_MAP = {
  AVAILABLE: INVENTORY_STATUS.IN_STOCK,
  IN_REPAIR: INVENTORY_STATUS.REPAIR,
  RETIRED: INVENTORY_STATUS.DISPOSED,
};

const INVENTORY_STATUS_VALUES = [
  ...new Set([
    ...Object.values(INVENTORY_STATUS),
    ...Object.keys(LEGACY_INVENTORY_STATUS_MAP),
  ]),
];

// Handles normalize inventory status.
const normalizeInventoryStatus = (status) => {
  return LEGACY_INVENTORY_STATUS_MAP[status] || status;
};

// Handles inventory status query values with legacy compatibility.
const getInventoryStatusQueryValues = (status) => {
  const normalizedStatus = normalizeInventoryStatus(status);
  const legacyValues = Object.entries(LEGACY_INVENTORY_STATUS_MAP)
    .filter(([, value]) => value === normalizedStatus)
    .map(([key]) => key);

  return [...new Set([normalizedStatus, ...legacyValues])];
};

const INVENTORY_CONDITION = {
  NEW: "NEW",
  GOOD: "GOOD",
  FAIR: "FAIR",
  DAMAGED: "DAMAGED",
};

const INVENTORY_PERMISSIONS = {
  CREATE_INVENTORY: "CREATE_INVENTORY",
  VIEW_INVENTORY: "VIEW_INVENTORY",
  UPDATE_INVENTORY: "UPDATE_INVENTORY",
  DELETE_INVENTORY: "DELETE_INVENTORY",
};

module.exports = {
  INVENTORY_STATUS,
  LEGACY_INVENTORY_STATUS_MAP,
  INVENTORY_STATUS_VALUES,
  normalizeInventoryStatus,
  getInventoryStatusQueryValues,
  INVENTORY_CONDITION,
  INVENTORY_PERMISSIONS,
};