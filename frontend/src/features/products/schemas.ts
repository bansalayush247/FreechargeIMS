import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required."),
  sku: z.string().min(2, "SKU is required."),
  category: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.coerce.number().int().nonnegative().optional(),
  reorderLevel: z.coerce.number().int().nonnegative().optional(),
});

export type ProductSchema = z.infer<typeof productSchema>;