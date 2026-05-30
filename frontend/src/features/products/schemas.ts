import { z } from "zod";
import { PRODUCT_CATEGORY_OPTIONS } from "@/src/features/products/constants";

const productCategoryValues = PRODUCT_CATEGORY_OPTIONS.map((option) => option.value) as [string, ...string[]];

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required."),
  sku: z.string().min(2, "SKU is required."),
  category: z.enum(productCategoryValues).optional(),
  unit: z.string().optional(),
  assetType: z.enum(["CONSUMABLE", "NON_CONSUMABLE"]),
  isTrackable: z.boolean().optional(),
  quantity: z.coerce.number().int().nonnegative().optional(),
  reorderLevel: z.coerce.number().int().nonnegative().optional(),
});

export type ProductSchema = z.infer<typeof productSchema>;