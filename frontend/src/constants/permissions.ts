export const permissions = {
  dashboard: ["VIEW_DASHBOARD"],
  products: ["VIEW_PRODUCTS", "CREATE_PRODUCT", "UPDATE_PRODUCT"],
  warehouses: ["VIEW_WAREHOUSES", "CREATE_WAREHOUSE", "UPDATE_WAREHOUSE"],
  inventory: ["VIEW_INVENTORY", "CREATE_INVENTORY", "UPDATE_INVENTORY"],
  orders: ["VIEW_ORDERS", "CREATE_ORDER", "UPDATE_ORDER"],
  users: ["VIEW_USERS", "CREATE_USER", "UPDATE_USER"],
  settings: ["VIEW_SETTINGS", "UPDATE_SETTINGS"],
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions][number];