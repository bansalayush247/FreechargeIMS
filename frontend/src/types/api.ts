export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListResponse<T> = ApiResponse<{
  items: T[];
  pagination?: PaginationMeta;
}>;

export type ApiErrorResponse = {
  message?: string;
  code?: string;
  errors?: Record<string, string[] | string>;
};