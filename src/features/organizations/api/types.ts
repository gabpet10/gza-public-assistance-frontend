export type Organization = {
  id: string;
  name: string;
  logo: string | null;
  vatNumber: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  isActive: boolean;
  createdAt: string;
};

export type OrganizationDto = {
  id?: string;
  name?: string;
  logo?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  isActive?: boolean;
  createdAt?: string;
};

export type OrganizationPagedResultDto = {
  items?: OrganizationDto[];
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type OrganizationUpsertRequestDto = {
  name?: string | null;
  logo?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  isActive?: boolean;
};

export type OrganizationOnboardingRequestDto = {
  OrganizationName?: string | null;
  OrganizationLogo?: string | null;
  OrganizationVatNumber?: string | null;
  OrganizationAddress?: string | null;
  OrganizationCity?: string | null;
  OrganizationRegion?: string | null;
  OrganizationIsActive?: boolean;
  UserEmail?: string | null;
  UserPassword?: string | null;
  UserFirstName?: string | null;
  UserLastName?: string | null;
  UserPhone?: string | null;
  UserIsActive?: boolean;
  UserType?: string | null;
  MembershipStatus?: string | null;
  MembershipJoinedAt?: string | null;
};

export type OrganizationOnboardingResponseDto =
  | OrganizationDto
  | { organization?: OrganizationDto | null };

export type OrganizationFormData = {
  name: string;
  logo: string;
  vatNumber: string;
  address: string;
  city: string;
  region: string;
  isActive: boolean;
  operatorEmail?: string;
  operatorFirstName?: string;
  operatorLastName?: string;
  operatorPhone?: string;
  operatorPassword?: string;
};

export type OrganizationStatusFilter = "all" | "active" | "inactive";
