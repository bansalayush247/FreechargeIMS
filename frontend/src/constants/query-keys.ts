export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  products: {
    all: ["products"] as const,
  },
  warehouses: {
    all: ["warehouses"] as const,
  },
  spaces: {
    all: ["spaces"] as const,
    my: ["spaces", "my"] as const,
    detail: (spaceId: string) => ["spaces", spaceId] as const,
  },
  inventory: {
    all: ["inventory"] as const,
  },
} as const;