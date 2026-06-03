import { z } from "zod";

export const warehouseSchema = z.object({
  name: z.string().min(2, "Warehouse name is required."),
  code: z.string().min(2, "Warehouse code is required."),
  city: z.string().optional(),
  state: z.string().optional(),
  capacity: z.coerce.number().int().nonnegative().optional(),
});

export type WarehouseSchema = z.infer<typeof warehouseSchema>;