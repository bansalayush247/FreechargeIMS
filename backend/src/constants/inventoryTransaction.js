const INVENTORY_TRANSACTION_TYPES = {
  STOCK_IN: "STOCK_IN",
  ASSIGN: "ASSIGN",
  RETURN: "RETURN",
  TRANSFER: "TRANSFER",
  REPAIR: "REPAIR",
  DISPOSE: "DISPOSE",

  // Operational/legacy values kept for backward compatibility.
  ASSIGNED: "ASSIGN",
  RETURNED: "RETURN",
  TRANSFERRED: "TRANSFER",
  REPAIR_SENT: "REPAIR",
  REPAIR_COMPLETED: "REPAIR",
  RETIRED: "DISPOSE",
  LOST: "LOST",
  DAMAGED: "DAMAGED",
  STATUS_CHANGED: "STATUS_CHANGED",
};

const LEGACY_INVENTORY_TRANSACTION_TYPE_MAP = {
  ASSIGNED: INVENTORY_TRANSACTION_TYPES.ASSIGN,
  RETURNED: INVENTORY_TRANSACTION_TYPES.RETURN,
  TRANSFERRED: INVENTORY_TRANSACTION_TYPES.TRANSFER,
  REPAIR_SENT: INVENTORY_TRANSACTION_TYPES.REPAIR,
  REPAIR_COMPLETED: INVENTORY_TRANSACTION_TYPES.REPAIR,
  RETIRED: INVENTORY_TRANSACTION_TYPES.DISPOSE,
};

const INVENTORY_TRANSACTION_TYPE_VALUES = [
  ...new Set([
    ...Object.values(INVENTORY_TRANSACTION_TYPES),
    ...Object.keys(LEGACY_INVENTORY_TRANSACTION_TYPE_MAP),
  ]),
];

// Handles normalize inventory transaction type.
const normalizeInventoryTransactionType = (transactionType) => {
  return (
    LEGACY_INVENTORY_TRANSACTION_TYPE_MAP[transactionType] ||
    transactionType
  );
};

// Handles inventory transaction query values with legacy compatibility.
const getInventoryTransactionTypeQueryValues = (transactionType) => {
  const normalizedType = normalizeInventoryTransactionType(
    transactionType
  );
  const legacyValues = Object.entries(
    LEGACY_INVENTORY_TRANSACTION_TYPE_MAP
  )
    .filter(([, value]) => value === normalizedType)
    .map(([key]) => key);

  return [...new Set([normalizedType, ...legacyValues])];
};

const INVENTORY_TRANSACTION_PERMISSIONS = {
  CREATE_INVENTORY_TRANSACTION: "CREATE_INVENTORY_TRANSACTION",
  VIEW_INVENTORY_TRANSACTION: "VIEW_INVENTORY_TRANSACTION",
};

module.exports = {
  INVENTORY_TRANSACTION_TYPES,
  LEGACY_INVENTORY_TRANSACTION_TYPE_MAP,
  INVENTORY_TRANSACTION_TYPE_VALUES,
  normalizeInventoryTransactionType,
  getInventoryTransactionTypeQueryValues,
  INVENTORY_TRANSACTION_PERMISSIONS,
};