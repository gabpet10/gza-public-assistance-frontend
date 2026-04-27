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
    id: dto.id ?? "",
    name: dto.name ?? "",
    logo: dto.logo ?? null,
    vatNumber: dto.vatNumber ?? null,
    address: dto.address ?? null,
    city: dto.city ?? null,
    region: dto.region ?? null,
    isActive: dto.isActive ?? false,
    createdAt: dto.createdAt ?? "",
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
    OrganizationName: toNullableTrimmed(input.name),
    OrganizationLogo: toNullableTrimmed(input.logo),
    OrganizationVatNumber: toNullableTrimmed(input.vatNumber),
    OrganizationAddress: toNullableTrimmed(input.address),
    OrganizationCity: toNullableTrimmed(input.city),
    OrganizationRegion: toNullableTrimmed(input.region),
    OrganizationIsActive: input.isActive,
    UserEmail: toNullableTrimmed(input.operatorEmail),
    UserPassword: toNullableTrimmed(input.operatorPassword),
    UserFirstName: toNullableTrimmed(input.operatorFirstName),
    UserLastName: toNullableTrimmed(input.operatorLastName),
    UserPhone: toNullableTrimmed(input.operatorPhone),
    UserIsActive: true,
    UserType: "operator",
    MembershipStatus: "active",
    MembershipJoinedAt: null,
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

  const wrappedResponse = response as { organization?: OrganizationDto | null };

  if (wrappedResponse.organization) {
    return toOrganizationModel(wrappedResponse.organization);
  }

  if ("organization" in wrappedResponse) {
    throw new Error("Risposta onboarding organizzazione non valida.");
  }

  return toOrganizationModel(response as OrganizationDto);
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
