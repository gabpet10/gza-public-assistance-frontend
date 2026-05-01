import { apiClient } from "@/core/api/api-client";
import { mapPagedResultDto, toNullableTrimmed } from "@/core/api/normalization";
import { buildQueryString } from "@/core/api/query-string";
import type { QueryParameters } from "@/core/api/types";
import type {
  Organization,
  OrganizationDto,
  OrganizationFormData,
  OrganizationOnboardingRequestDto,
  OrganizationOnboardingResponseDto,
  OrganizationPagedResultDto,
  OrganizationStatusFilter,
  OrganizationUpsertRequestDto,
} from "@/features/organizations/api/types";

type SearchOrganizationsInput = QueryParameters & {
  isActive?: boolean;
  region?: string;
};

function requireField<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Invalid organizations payload: missing ${fieldName}`);
  }

  return value;
}

export function toOrganizationActiveFilter(filter: OrganizationStatusFilter) {
  if (filter === "active") {
    return true;
  }

  if (filter === "inactive") {
    return false;
  }

  return undefined;
}

function toOrganizationModel(dto: OrganizationDto): Organization {
  return {
    id: requireField(dto.id, "organization.id"),
    name: requireField(dto.name, "organization.name"),
    logo: dto.logo ?? null,
    vatNumber: requireField(dto.vatNumber, "organization.vatNumber"),
    address: requireField(dto.address, "organization.address"),
    city: requireField(dto.city, "organization.city"),
    region: requireField(dto.region, "organization.region"),
    isActive: requireField(dto.isActive, "organization.isActive"),
    createdAt: requireField(dto.createdAt, "organization.createdAt"),
  };
}

function toBasePayload(
  input: OrganizationFormData,
): OrganizationUpsertRequestDto {
  return {
    name: toNullableTrimmed(input.name),
    logo: toNullableTrimmed(input.logo),
    vatNumber: toNullableTrimmed(input.vatNumber),
    address: toNullableTrimmed(input.address),
    city: toNullableTrimmed(input.city),
    region: toNullableTrimmed(input.region),
    isActive: input.isActive,
  };
}

function toOnboardingPayload(
  input: OrganizationFormData,
): OrganizationOnboardingRequestDto {
  return {
    organizationName: toNullableTrimmed(input.name),
    organizationLogo: toNullableTrimmed(input.logo),
    organizationVatNumber: toNullableTrimmed(input.vatNumber),
    organizationAddress: toNullableTrimmed(input.address),
    organizationCity: toNullableTrimmed(input.city),
    organizationRegion: toNullableTrimmed(input.region),
    organizationIsActive: input.isActive,
    userEmail: toNullableTrimmed(input.operatorEmail),
    userPassword: toNullableTrimmed(input.operatorPassword),
    userFirstName: toNullableTrimmed(input.operatorFirstName),
    userLastName: toNullableTrimmed(input.operatorLastName),
    userIsActive: true,
    userType: "operator",
    membershipStatus: "active",
    membershipJoinedAt: null,
  };
}

function toUpdatePayload(input: OrganizationFormData) {
  return toBasePayload(input);
}

export async function searchOrganizations({
  ...parameters
}: SearchOrganizationsInput) {
  const query = buildQueryString(parameters);
  const response = await apiClient<OrganizationPagedResultDto>(
    `/api/bff/organizations${query}`,
  );

  return mapPagedResultDto(response, toOrganizationModel);
}

export async function getOrganizationById(id: string) {
  const response = await apiClient<OrganizationDto>(
    `/api/bff/organizations/${id}`,
  );
  return toOrganizationModel(response);
}

export async function createOrganization(input: OrganizationFormData) {
  if (!input.operatorEmail || !input.operatorPassword) {
    throw new Error("Email e password operatore sono obbligatorie.");
  }

  const response = await apiClient<OrganizationOnboardingResponseDto>(
    "/api/bff/onboarding/organization-user",
    {
      method: "POST",
      body: JSON.stringify(toOnboardingPayload(input)),
    },
  );

  const organizationId = requireField(
    response.organizationId,
    "onboarding.organizationId",
  );
  return getOrganizationById(organizationId);
}

export async function updateOrganization(
  id: string,
  input: OrganizationFormData,
) {
  const response = await apiClient<OrganizationDto>(
    `/api/bff/organizations/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(toUpdatePayload(input)),
    },
  );

  return toOrganizationModel(response);
}

export async function deleteOrganization(id: string) {
  return apiClient<void>(`/api/bff/organizations/${id}`, {
    method: "DELETE",
  });
}
