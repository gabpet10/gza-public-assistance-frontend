import { apiClient } from "@/core/api/api-client";
import { mapPagedResultDto, toNullableTrimmed } from "@/core/api/normalization";
import { buildQueryString } from "@/core/api/query-string";
import type { QueryParameters } from "@/core/api/types";
import type {
  CreateUserForOrganizationInput,
  User,
  UserCreateRequestDto,
  UserDto,
  UserFormData,
  UserOnboardingRequestDto,
  UserOnboardingResponseDto,
  UserPagedResultDto,
  UserStatusFilter,
  UserTypeValue,
  UserUpdateRequestDto,
} from "@/features/users/api/types";
import { normalizeUserType } from "@/features/users/api/types";

type SearchUsersInput = QueryParameters & {
  isActive?: boolean;
  organizationId?: string;
  userTypes?: UserTypeValue[];
};

function requireField<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Invalid users payload: missing ${fieldName}`);
  }

  return value;
}

export function toUserActiveFilter(filter: UserStatusFilter) {
  if (filter === "active") {
    return true;
  }

  if (filter === "inactive") {
    return false;
  }

  return undefined;
}

function toUserModel(dto: UserDto): User {
  const rawUserType = requireField(dto.userType, "user.userType");
  const userType = normalizeUserType(rawUserType);

  if (!userType) {
    throw new Error(
      `Invalid users payload: unsupported userType ${rawUserType}`,
    );
  }

  return {
    id: requireField(dto.id, "user.id"),
    email: requireField(dto.email, "user.email"),
    firstName: requireField(dto.firstName, "user.firstName"),
    lastName: requireField(dto.lastName, "user.lastName"),
    phone: dto.phone ?? null,
    isActive: requireField(dto.isActive, "user.isActive"),
    userType,
    mustChangePassword: requireField(
      dto.mustChangePassword,
      "user.mustChangePassword",
    ),
    createdAt: requireField(dto.createdAt, "user.createdAt"),
    lastLoginAt: dto.lastLoginAt ?? null,
  };
}

function toCreatePayload(input: UserFormData): UserCreateRequestDto {
  return {
    email: toNullableTrimmed(input.email),
    password: toNullableTrimmed(input.password),
    firstName: toNullableTrimmed(input.firstName),
    lastName: toNullableTrimmed(input.lastName),
    phone: toNullableTrimmed(input.phone),
    isActive: input.isActive,
    userType: input.userType,
  };
}

function toUpdatePayload(input: UserFormData): UserUpdateRequestDto {
  const normalizedPassword = toNullableTrimmed(input.password);

  return {
    email: toNullableTrimmed(input.email),
    password: normalizedPassword,
    firstName: toNullableTrimmed(input.firstName),
    lastName: toNullableTrimmed(input.lastName),
    phone: toNullableTrimmed(input.phone),
    isActive: input.isActive,
    userType: input.userType,
  };
}

export async function searchUsers({ ...parameters }: SearchUsersInput) {
  const query = buildQueryString(parameters);
  const response = await apiClient<UserPagedResultDto>(
    `/api/bff/users${query}`,
  );
  return mapPagedResultDto(response, toUserModel);
}

export async function getUserById(id: string, organizationId?: string) {
  const query = buildQueryString({ organizationId });
  const response = await apiClient<UserDto>(`/api/bff/users/${id}${query}`);
  return toUserModel(response as UserDto);
}

export async function createUser(input: UserFormData) {
  const response = await apiClient<UserDto>("/api/bff/users", {
    method: "POST",
    body: JSON.stringify(toCreatePayload(input)),
  });

  return toUserModel(response);
}

function toCreateUserForOrganizationPayload(
  input: CreateUserForOrganizationInput,
): UserOnboardingRequestDto {
  return {
    organizationId: toNullableTrimmed(input.organizationId),
    userEmail: toNullableTrimmed(input.email),
    userPassword: toNullableTrimmed(input.password),
    userFirstName: toNullableTrimmed(input.firstName),
    userLastName: toNullableTrimmed(input.lastName),
    userIsActive: input.isActive,
    userType: input.userType,
    membershipStatus: "active",
    membershipJoinedAt: null,
  };
}

export async function createUserForOrganization(
  input: CreateUserForOrganizationInput,
) {
  const response = await apiClient<UserOnboardingResponseDto>(
    "/api/bff/onboarding/organization-existing-user",
    {
      method: "POST",
      body: JSON.stringify(toCreateUserForOrganizationPayload(input)),
    },
  );

  const userId = requireField(response.userId, "onboarding.userId");
  return getUserById(userId, input.organizationId);
}

export async function updateUser(id: string, input: UserFormData) {
  const response = await apiClient<UserDto>(`/api/bff/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(toUpdatePayload(input)),
  });

  return toUserModel(response);
}

export async function deleteUserFromOrganization(
  organizationId: string,
  userId: string,
) {
  return apiClient<void>(
    `/api/bff/onboarding/organization-users/${organizationId}/${userId}`,
    {
      method: "DELETE",
    },
  );
}
