export type Product = {
  _id?: string;
  id?: string;
  name: string;
  sku?: string;
  category?: string;
  imageUrl?: string;
  unit?: string;
  status?: string;
  quantity?: number;
  reorderLevel?: number;
  assetType?: "CONSUMABLE" | "NON_CONSUMABLE";
  isTrackable?: boolean;
  [key: string]: unknown;
};

export type ProductListResponse = {
  items: Product[];
};