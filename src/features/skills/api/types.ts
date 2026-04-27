export const skillTypeOptions = [
  { value: "all", label: "Tutti i tipi" },
  { value: "medico", label: "Medico" },
  { value: "autista", label: "Autista" },
  { value: "soccorritore", label: "Soccorritore" },
] as const;

export type SkillTypeFilter = (typeof skillTypeOptions)[number]["value"];
export type SkillTypeValue = Exclude<SkillTypeFilter, "all">;

const skillTypeAliases: Record<string, SkillTypeValue> = {
  medico: "medico",
  medical: "medico",
  autista: "autista",
  transport: "autista",
  driver: "autista",
  soccorritore: "soccorritore",
  emergency: "soccorritore",
  support: "soccorritore",
  coordination: "soccorritore",
};

export function normalizeSkillType(
  value?: string | null,
): SkillTypeValue | undefined {
  if (!value) {
    return undefined;
  }

  return skillTypeAliases[value.trim().toLowerCase()];
}

export function toSkillTypeLabel(value?: string | null) {
  const normalized = normalizeSkillType(value);
  if (!normalized) {
    return value ?? "-";
  }

  return (
    skillTypeOptions.find((option) => option.value === normalized)?.label ??
    normalized
  );
}

export type Skill = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: string;
};

export type SkillDto = {
  id?: string;
  name?: string;
  type?: string;
  isActive?: boolean;
  createdAt?: string;
};

export type SkillPagedResultDto = {
  items?: SkillDto[];
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type SkillUpsertRequestDto = {
  name?: string | null;
  type?: string | null;
  isActive?: boolean;
};

export type SkillFormData = {
  name: string;
  type: SkillTypeValue;
  isActive: boolean;
};

export type SkillStatusFilter = "all" | "active" | "inactive";
