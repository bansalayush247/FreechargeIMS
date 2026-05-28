export type Warehouse = {
  _id?: string;
  id?: string;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  status?: string;
  capacity?: number;
  [key: string]: unknown;
};