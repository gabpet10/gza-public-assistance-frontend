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
  UserUpdateRequestDto,
} from "@/features/users/api/types";

type SearchUsersInput = QueryParameters & {
  isActive?: boolean;
  organizationId?: string;
};

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
  return {
    id: dto.id ?? "",
    email: dto.email ?? "",
    firstName: dto.firstName ?? null,
    lastName: dto.lastName ?? null,
    phone: dto.phone ?? null,
    isActive: dto.isActive ?? false,
    createdAt: dto.createdAt ?? "",
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
  };
}

function toUpdatePayload(input: UserFormData): UserUpdateRequestDto {
  return {
    email: toNullableTrimmed(input.email),
    password: toNullableTrimmed(input.password),
    firstName: toNullableTrimmed(input.firstName),
    lastName: toNullableTrimmed(input.lastName),
    phone: toNullableTrimmed(input.phone),
    isActive: input.isActive,
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
    OrganizationId: toNullableTrimmed(input.organizationId),
    UserEmail: toNullableTrimmed(input.email),
    UserPassword: toNullableTrimmed(input.password),
    UserFirstName: toNullableTrimmed(input.firstName),
    UserLastName: toNullableTrimmed(input.lastName),
    UserPhone: toNullableTrimmed(input.phone),
    UserIsActive: input.isActive,
    UserType: "operator",
    MembershipStatus: "active",
    MembershipJoinedAt: null,
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

  if ("user" in response && response.user) {
    return toUserModel(response.user);
  }

  if ("user" in response) {
    throw new Error("Risposta onboarding utente non valida.");
  }

  return toUserModel(response as UserDto);
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
