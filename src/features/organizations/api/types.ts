export type Organization = {
  id: string;
  name: string;
  logo: string | null;
  vatNumber: string;
  address: string;
  city: string;
  region: string;
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
  organizationName?: string | null;
  organizationLogo?: string | null;
  organizationVatNumber?: string | null;
  organizationAddress?: string | null;
  organizationCity?: string | null;
  organizationRegion?: string | null;
  organizationIsActive?: boolean;
  userEmail?: string | null;
  userPassword?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  userIsActive?: boolean;
  userType?: string | null;
  membershipStatus?: string | null;
  membershipJoinedAt?: string | null;
};

export type OrganizationOnboardingResponseDto = {
  organizationId?: string;
  userId?: string;
  organizationMembershipId?: string;
  userType?: string;
  membershipStatus?: string;
};

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
