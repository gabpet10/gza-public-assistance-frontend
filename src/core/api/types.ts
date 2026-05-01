export type QueryParameters = {
  pageIndex: number;
  pageSize: number;
  searchText?: string;
  sortBy?: string;
  sortDescending?: boolean;
};

export type PagedResult<T> = {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  traceId?: string;
  additionalInfo?: string;
  errors?: Record<string, string[]>;
  extensions?: {
    code?: string;
    traceId?: string;
    additionalInfo?: string;
    errors?: Record<string, string[]>;
    [key: string]: unknown;
  };
};
