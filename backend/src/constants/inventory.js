const INVENTORY_STATUS = {
  AVAILABLE: "AVAILABLE",
  ASSIGNED_EMPLOYEE: "ASSIGNED_EMPLOYEE",
  ASSIGNED_MERCHANT: "ASSIGNED_MERCHANT",
  LOST: "LOST",
  DAMAGED: "DAMAGED",
  RETIRED: "RETIRED",
  DISPOSED: "DISPOSED",
  IN_STOCK: "AVAILABLE",
  ASSIGNED: "ASSIGNED_EMPLOYEE",
};

const LEGACY_INVENTORY_STATUS_MAP = {
  IN_STOCK: INVENTORY_STATUS.AVAILABLE,
  ASSIGNED: INVENTORY_STATUS.ASSIGNED_EMPLOYEE,
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

const INVENTORY_STOCK_ALERT_STATUS = {
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  PROCUREMENT_REQUIRED: "PROCUREMENT_REQUIRED",
};

const resolveInventoryStockAlertStatus = (stock) => {
  const availableQuantity = Number(stock?.availableQuantity || 0);
  const reorderLevel = Number(stock?.reorderLevel || 0);
  const reorderQuantity = Number(stock?.reorderQuantity || 0);

  if (availableQuantity <= 0) {
    return INVENTORY_STOCK_ALERT_STATUS.OUT_OF_STOCK;
  }

  if (reorderQuantity > 0 && availableQuantity <= reorderQuantity) {
    return INVENTORY_STOCK_ALERT_STATUS.PROCUREMENT_REQUIRED;
  }

  if (reorderLevel > 0 && availableQuantity <= reorderLevel) {
    return INVENTORY_STOCK_ALERT_STATUS.LOW_STOCK;
  }

  return null;
};

module.exports = {
  INVENTORY_STATUS,
  LEGACY_INVENTORY_STATUS_MAP,
  INVENTORY_STATUS_VALUES,
  normalizeInventoryStatus,
  getInventoryStatusQueryValues,
  INVENTORY_CONDITION,
  INVENTORY_PERMISSIONS,
  INVENTORY_STOCK_ALERT_STATUS,
  resolveInventoryStockAlertStatus,
};
