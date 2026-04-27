export type AuthenticatedMembership = {
  membershipId: string;
  organizationId: string;
  status: string;
  roles: string[];
};

export type AuthenticatedMembershipDto = {
  membershipId?: string;
  organizationId?: string;
  status?: string;
  roles?: string[] | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthSession = {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  activeOrganizationId?: string | null;
  activeOrganizationName?: string | null;
  activeOrganizationLogo?: string | null;
  mustChangePassword: boolean;
  expiresAtUtc: string;
  memberships: AuthenticatedMembership[];
  roles: string[];
};

export type BackendLoginResponseDto = {
  accessToken?: string;
  userId?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  activeOrganizationId?: string | null;
  activeOrganizationName?: string | null;
  activeOrganizationLogo?: string | null;
  mustChangePassword?: boolean;
  expiresAtUtc?: string;
  memberships?: AuthenticatedMembershipDto[] | null;
  roles?: string[] | null;
};

export type BackendLoginResponse = AuthSession & {
  accessToken: string;
};

export type LoginResponse = AuthSession;

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};
