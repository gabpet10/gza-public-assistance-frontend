import { apiClient } from "@/core/api/api-client";
import { mapPagedResultDto, toNullableTrimmed } from "@/core/api/normalization";
import { buildQueryString } from "@/core/api/query-string";
import type { QueryParameters } from "@/core/api/types";
import type {
  Skill,
  SkillDto,
  SkillFormData,
  SkillPagedResultDto,
  SkillStatusFilter,
  SkillTypeFilter,
  SkillTypeValue,
  SkillUpsertRequestDto,
} from "@/features/skills/api/types";
import { normalizeSkillType } from "@/features/skills/api/types";

type SearchSkillsInput = QueryParameters & {
  type?: string;
  isActive?: boolean;
};

export function toSkillActiveFilter(filter: SkillStatusFilter) {
  if (filter === "active") {
    return true;
  }

  if (filter === "inactive") {
    return false;
  }

  return undefined;
}

export function toBackendSkillType(filter: SkillTypeFilter) {
  if (filter === "all") {
    return undefined;
  }

  return normalizeSkillType(filter) ?? filter;
}

function toSkillModel(dto: SkillDto): Skill {
  return {
    id: dto.id ?? "",
    name: dto.name ?? "",
    type: dto.type ?? "",
    isActive: dto.isActive ?? false,
    createdAt: dto.createdAt ?? "",
  };
}

function toPayload(input: SkillFormData): SkillUpsertRequestDto {
  return {
    name: toNullableTrimmed(input.name),
    type: toNullableTrimmed(
      (normalizeSkillType(input.type) ?? input.type) as SkillTypeValue,
    ),
    isActive: input.isActive,
  };
}

export async function searchSkills({ ...parameters }: SearchSkillsInput) {
  const query = buildQueryString(parameters);
  const response = await apiClient<SkillPagedResultDto>(
    `/api/bff/skills${query}`,
  );
  return mapPagedResultDto(response, toSkillModel);
}

export async function getSkillById(id: string) {
  const response = await apiClient<SkillDto>(`/api/bff/skills/${id}`);
  return toSkillModel(response);
}

export async function createSkill(input: SkillFormData) {
  const response = await apiClient<SkillDto>("/api/bff/skills", {
    method: "POST",
    body: JSON.stringify(toPayload(input)),
  });

  return toSkillModel(response);
}

export async function updateSkill(id: string, input: SkillFormData) {
  const response = await apiClient<SkillDto>(`/api/bff/skills/${id}`, {
    method: "PUT",
    body: JSON.stringify(toPayload(input)),
  });

  return toSkillModel(response);
}

export async function deleteSkill(id: string) {
  return apiClient<void>(`/api/bff/skills/${id}`, {
    method: "DELETE",
  });
}
