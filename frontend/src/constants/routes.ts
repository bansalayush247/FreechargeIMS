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
    warehouses: "/warehouses",
    inventory: "/inventory",
    requests: "/requests",
    users: "/users",
    settings: "/settings",
    notifications: "/notifications",
    admin: "/admin",
    spaces: "/spaces",
  },
} as const;