export const userTypeOptions = [
  { value: "admin", label: "Admin" },
  { value: "operator", label: "Operatore" },
  { value: "volunteer", label: "Volontario" },
] as const;

export type UserTypeValue = (typeof userTypeOptions)[number]["value"];

const userTypeAliases: Record<string, UserTypeValue> = {
  admin: "admin",
  super_user: "admin",
  superuser: "admin",
  operator: "operator",
  org_admin: "operator",
  organization_admin: "operator",
  volunteer: "volunteer",
  volontario: "volunteer",
};

export function normalizeUserType(
  value?: string | null,
): UserTypeValue | undefined {
  if (!value) {
    return undefined;
  }

  return userTypeAliases[value.trim().toLowerCase()];
}

export function toUserTypeLabel(value?: string | null) {
  const normalized = normalizeUserType(value);
  if (!normalized) {
    return value ?? "-";
  }

  return (
    userTypeOptions.find((option) => option.value === normalized)?.label ??
    normalized
  );
}

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  userType: UserTypeValue;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export type UserDto = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  isActive?: boolean;
  userType?: string;
  mustChangePassword?: boolean;
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
  userType?: UserTypeValue | null;
};

export type UserUpdateRequestDto = {
  email?: string | null;
  password?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isActive?: boolean;
  userType?: UserTypeValue | null;
};

export type UserOnboardingRequestDto = {
  organizationId?: string | null;
  userEmail?: string | null;
  userPassword?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  userIsActive?: boolean;
  userType?: string | null;
  membershipStatus?: string | null;
  membershipJoinedAt?: string | null;
};

export type UserOnboardingResponseDto = {
  organizationId?: string;
  userId?: string;
  organizationMembershipId?: string;
  userType?: string;
  membershipStatus?: string;
};

export type UserFormData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  userType: UserTypeValue;
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
  userType: UserTypeValue;
};
