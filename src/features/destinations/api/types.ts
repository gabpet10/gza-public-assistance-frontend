export type Destination = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  province: string;
  notes: string;
  createdAt: string;
};

export type DestinationDto = {
  id?: string | null;
  organizationId?: string | null;
  name?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  notes?: string | null;
  createdAt?: string | null;
};

export type DestinationPagedResultDto = {
  items?: DestinationDto[] | null;
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type DestinationUpsertRequestDto = {
  organizationId: string | null;
  name: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  notes: string | null;
};

export type DestinationFormData = {
  organizationId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  province: string;
  notes: string;
};
