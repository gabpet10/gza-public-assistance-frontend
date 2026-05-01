import type { SkillTypeFilter } from "@/features/skills/api/types";

export type VolunteerSkill = {
  id: string;
  volunteerId: string;
  skillType: string;
  level: string;
  verified: boolean;
};

export type VolunteerSkillDto = {
  id?: string;
  volunteerId?: string;
  skillType?: string;
  level?: string;
  verified?: boolean;
};

export type VolunteerListItem = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  fiscalCode: string;
  userId: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userIsActive: boolean | null;
  isActive: boolean;
  createdAt: string;
};

export type VolunteerListItemDto = {
  id?: string;
  organizationId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  fiscalCode?: string;
  userId?: string | null;
  userEmail?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  userIsActive?: boolean | null;
  isActive?: boolean;
  createdAt?: string;
};

export type VolunteerUserLinkInput = {
  userId: string;
};

export type VolunteerUserLinkRequestDto = {
  userId?: string | null;
};

export type VolunteerUserLinkResponseDto = {
  volunteerId?: string;
  userId?: string;
  linkedAt?: string;
};

export type VolunteerUserLinkResponse = {
  volunteerId: string;
  userId: string;
  linkedAt: string;
};

export type Volunteer = VolunteerListItem & {
  skills: VolunteerSkill[];
};

export type VolunteerDto = VolunteerListItemDto & {
  skills?: VolunteerSkillDto[];
};

export type VolunteerPagedResultDto = {
  items?: VolunteerListItemDto[];
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type VolunteerUpsertRequestDto = {
  organizationId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  fiscalCode?: string | null;
  isActive?: boolean;
};

export type VolunteerSkillUpsertRequestDto = {
  skillType?: string | null;
  level?: string | null;
  verified?: boolean;
};

export type VolunteerSkillUpdateRequestDto = {
  level?: string | null;
  verified?: boolean;
};

export type VolunteerStatusFilter = "all" | "active" | "inactive";

export const skillLevelOptions = [
  { value: "nessuno", label: "Nessuno" },
  { value: "1", label: "Livello 1" },
  { value: "2", label: "Livello 2" },
  { value: "3", label: "Livello 3" },
] as const;

export type SkillLevelValue = (typeof skillLevelOptions)[number]["value"];

const skillLevelAliases: Record<string, SkillLevelValue> = {
  nessuno: "nessuno",
  "1": "1",
  "2": "2",
  "3": "3",
};

export function normalizeSkillLevel(
  value?: string | null,
): SkillLevelValue | undefined {
  if (!value) {
    return undefined;
  }

  return skillLevelAliases[value.trim().toLowerCase()];
}

export function toSkillLevelLabel(value?: string | null) {
  const normalized = normalizeSkillLevel(value);
  if (!normalized) {
    return value ?? "-";
  }

  return (
    skillLevelOptions.find((option) => option.value === normalized)?.label ??
    normalized
  );
}

export type VolunteerFormData = {
  organizationId: string;
  firstName: string;
  lastName: string;
  phone: string;
  fiscalCode: string;
  isActive: boolean;
};

export type VolunteerSkillFormData = {
  skillType: Exclude<SkillTypeFilter, "all">;
  level: SkillLevelValue;
  verified: boolean;
};
