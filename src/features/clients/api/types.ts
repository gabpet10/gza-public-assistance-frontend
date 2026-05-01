export type Client = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  notes: string;
  createdAt: string;
};

export type ClientDto = {
  id?: string | null;
  organizationId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  notes?: string | null;
  createdAt?: string | null;
};

export type ClientPagedResultDto = {
  items?: ClientDto[] | null;
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type ClientUpsertRequestDto = {
  organizationId: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  notes: string | null;
};

export type ClientFormData = {
  organizationId: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  notes: string;
};
