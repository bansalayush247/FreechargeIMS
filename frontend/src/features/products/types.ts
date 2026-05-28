export type Product = {
  _id?: string;
  id?: string;
  name: string;
  sku?: string;
  category?: string;
  unit?: string;
  status?: string;
  quantity?: number;
  reorderLevel?: number;
  [key: string]: unknown;
};

export type ProductListResponse = {
  items: Product[];
};