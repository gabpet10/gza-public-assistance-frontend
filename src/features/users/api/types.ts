export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export type UserDto = {
  id?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
};

export type UserPagedResultDto = {
  items?: UserDto[];
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type UserCreateRequestDto = {
  email?: string | null;
  password?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

export type UserUpdateRequestDto = {
  email?: string | null;
  password?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

export type UserOnboardingRequestDto = {
  OrganizationId?: string | null;
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

export type UserOnboardingResponseDto = UserDto | { user?: UserDto | null };

export type UserFormData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
};

export type UserStatusFilter = "all" | "active" | "inactive";

export type CreateUserForOrganizationInput = {
  organizationId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
};
