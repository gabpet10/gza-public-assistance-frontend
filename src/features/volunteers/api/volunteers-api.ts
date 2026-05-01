import { apiClient } from "@/core/api/api-client";
import { mapPagedResultDto, toNullableTrimmed } from "@/core/api/normalization";
import { buildQueryString } from "@/core/api/query-string";
import type { QueryParameters } from "@/core/api/types";
import type {
  Volunteer,
  VolunteerDto,
  VolunteerFormData,
  VolunteerListItem,
  VolunteerListItemDto,
  VolunteerPagedResultDto,
  VolunteerSkill,
  VolunteerSkillDto,
  VolunteerSkillFormData,
  VolunteerSkillUpdateRequestDto,
  VolunteerSkillUpsertRequestDto,
  VolunteerUserLinkInput,
  VolunteerUserLinkRequestDto,
  VolunteerUserLinkResponse,
  VolunteerUserLinkResponseDto,
  VolunteerStatusFilter,
  VolunteerUpsertRequestDto,
} from "@/features/volunteers/api/types";
import { normalizeSkillLevel } from "@/features/volunteers/api/types";
import { normalizeSkillType } from "@/features/skills/api/types";

type SearchVolunteersInput = QueryParameters & {
  isActive?: boolean;
  organizationId?: string;
};

function requireField<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Invalid volunteers payload: missing ${fieldName}`);
  }

  return value;
}

export function toBackendActiveFilter(filter: VolunteerStatusFilter) {
  if (filter === "active") {
    return true;
  }

  if (filter === "inactive") {
    return false;
  }

  return undefined;
}

function toVolunteerListItemModel(
  dto: VolunteerListItemDto,
): VolunteerListItem {
  return {
    id: requireField(dto.id, "volunteer.id"),
    organizationId: requireField(
      dto.organizationId,
      "volunteer.organizationId",
    ),
    firstName: requireField(dto.firstName, "volunteer.firstName"),
    lastName: requireField(dto.lastName, "volunteer.lastName"),
    fullName: requireField(dto.fullName, "volunteer.fullName"),
    phone: requireField(dto.phone, "volunteer.phone"),
    fiscalCode: requireField(dto.fiscalCode, "volunteer.fiscalCode"),
    userId: dto.userId ?? null,
    userEmail: dto.userEmail ?? null,
    userFirstName: dto.userFirstName ?? null,
    userLastName: dto.userLastName ?? null,
    userIsActive: dto.userIsActive ?? null,
    isActive: requireField(dto.isActive, "volunteer.isActive"),
    createdAt: requireField(dto.createdAt, "volunteer.createdAt"),
  };
}

function toVolunteerSkillModel(dto: VolunteerSkillDto): VolunteerSkill {
  return {
    id: requireField(dto.id, "volunteerSkill.id"),
    volunteerId: requireField(dto.volunteerId, "volunteerSkill.volunteerId"),
    skillType: requireField(dto.skillType, "volunteerSkill.skillType"),
    level: requireField(dto.level, "volunteerSkill.level"),
    verified: requireField(dto.verified, "volunteerSkill.verified"),
  };
}

function toVolunteerModel(dto: VolunteerDto): Volunteer {
  return {
    ...toVolunteerListItemModel(dto),
    skills: (dto.skills ?? []).map(toVolunteerSkillModel),
  };
}

export async function searchVolunteers({
  ...parameters
}: SearchVolunteersInput) {
  const query = buildQueryString(parameters);
  const response = await apiClient<VolunteerPagedResultDto>(
    `/api/bff/volunteers${query}`,
  );

  return mapPagedResultDto(response, toVolunteerListItemModel);
}

export async function getVolunteerById(id: string, organizationId?: string) {
  const query = buildQueryString({ organizationId });
  const response = await apiClient<VolunteerDto>(
    `/api/bff/volunteers/${id}${query}`,
  );
  return toVolunteerModel(response);
}

function toPayload(input: VolunteerFormData): VolunteerUpsertRequestDto {
  return {
    organizationId: toNullableTrimmed(input.organizationId),
    firstName: toNullableTrimmed(input.firstName),
    lastName: toNullableTrimmed(input.lastName),
    phone: toNullableTrimmed(input.phone),
    fiscalCode: toNullableTrimmed(input.fiscalCode),
    isActive: input.isActive,
  };
}

function toVolunteerUserLinkPayload(
  input: VolunteerUserLinkInput,
): VolunteerUserLinkRequestDto {
  return {
    userId: toNullableTrimmed(input.userId),
  };
}

function toVolunteerUserLinkResponse(
  dto: VolunteerUserLinkResponseDto,
): VolunteerUserLinkResponse {
  return {
    volunteerId: requireField(dto.volunteerId, "volunteerUserLink.volunteerId"),
    userId: requireField(dto.userId, "volunteerUserLink.userId"),
    linkedAt: requireField(dto.linkedAt, "volunteerUserLink.linkedAt"),
  };
}

export async function createVolunteer(input: VolunteerFormData) {
  const response = await apiClient<VolunteerDto>("/api/bff/volunteers", {
    method: "POST",
    body: JSON.stringify(toPayload(input)),
  });

  return toVolunteerModel(response);
}

export async function updateVolunteer(id: string, input: VolunteerFormData) {
  const response = await apiClient<VolunteerDto>(`/api/bff/volunteers/${id}`, {
    method: "PUT",
    body: JSON.stringify(toPayload(input)),
  });

  return toVolunteerModel(response);
}

export async function linkVolunteerUser(
  volunteerId: string,
  input: VolunteerUserLinkInput,
) {
  const response = await apiClient<VolunteerUserLinkResponseDto>(
    `/api/bff/volunteers/${volunteerId}/user-link`,
    {
      method: "POST",
      body: JSON.stringify(toVolunteerUserLinkPayload(input)),
    },
  );

  return toVolunteerUserLinkResponse(response);
}

export async function deleteVolunteer(id: string) {
  return apiClient<void>(`/api/bff/volunteers/${id}`, {
    method: "DELETE",
  });
}

function toSkillPayload(
  input: VolunteerSkillFormData,
): VolunteerSkillUpsertRequestDto {
  return {
    skillType: toNullableTrimmed(
      normalizeSkillType(input.skillType) ?? input.skillType,
    ),
    level: toNullableTrimmed(normalizeSkillLevel(input.level) ?? input.level),
    verified: input.verified,
  };
}

export async function addVolunteerSkill(
  volunteerId: string,
  input: VolunteerSkillFormData,
) {
  const response = await apiClient<VolunteerSkillDto>(
    `/api/bff/volunteers/${volunteerId}/skills`,
    {
      method: "POST",
      body: JSON.stringify(toSkillPayload(input)),
    },
  );

  return toVolunteerSkillModel(response);
}

function toSkillUpdatePayload(
  input: Omit<VolunteerSkillFormData, "skillType">,
): VolunteerSkillUpdateRequestDto {
  return {
    level: toNullableTrimmed(normalizeSkillLevel(input.level) ?? input.level),
    verified: input.verified,
  };
}

export async function updateVolunteerSkill(
  volunteerId: string,
  volunteerSkillId: string,
  input: Omit<VolunteerSkillFormData, "skillType">,
) {
  const response = await apiClient<VolunteerSkillDto>(
    `/api/bff/volunteers/${volunteerId}/skills/${volunteerSkillId}`,
    {
      method: "PUT",
      body: JSON.stringify(toSkillUpdatePayload(input)),
    },
  );

  return toVolunteerSkillModel(response);
}

export async function deleteVolunteerSkill(
  volunteerId: string,
  volunteerSkillId: string,
) {
  return apiClient<void>(
    `/api/bff/volunteers/${volunteerId}/skills/${volunteerSkillId}`,
    {
      method: "DELETE",
    },
  );
}
