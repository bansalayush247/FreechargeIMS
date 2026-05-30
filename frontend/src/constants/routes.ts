export const routePaths = {
  public: {
    home: "/",
  },
  auth: {
    login: "/login",
    signup: "/signup",
  },
  dashboard: {
    home: "/dashboard",
    products: "/products",
    // storage-locations replaces warehouses path
    storageLocations: "/storage-locations",
    // keep legacy key for compatibility
    warehouses: "/storage-locations",
    inventory: "/inventory",
    requests: "/requests",
    users: "/users",
    settings: "/settings",
    notifications: "/notifications",
    admin: "/admin",
    spaces: "/spaces",
  },
} as const;