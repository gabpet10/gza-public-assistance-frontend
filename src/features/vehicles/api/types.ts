export const vehicleTypeOptions = [
  { value: "ambulanza", label: "Ambulanza" },
  { value: "autovettura", label: "Autovettura" },
] as const;

export type VehicleTypeValue = (typeof vehicleTypeOptions)[number]["value"];

const vehicleTypeAliases: Record<string, VehicleTypeValue> = {
  ambulanza: "ambulanza",
  ambulance: "ambulanza",
  autovettura: "autovettura",
  car: "autovettura",
  auto: "autovettura",
};

export function normalizeVehicleType(
  value?: string | null,
): VehicleTypeValue | undefined {
  if (!value) {
    return undefined;
  }

  return vehicleTypeAliases[value.trim().toLowerCase()];
}

export function toVehicleTypeLabel(value?: string | null) {
  const normalized = normalizeVehicleType(value);
  if (!normalized) {
    return value ?? "-";
  }

  return (
    vehicleTypeOptions.find((option) => option.value === normalized)?.label ??
    normalized
  );
}

export type Vehicle = {
  id: string;
  organizationId: string;
  plateNumber: string;
  type: VehicleTypeValue | null;
  description: string | null;
  createdAt: string;
};

export type VehicleDto = {
  id?: string;
  organizationId?: string;
  plateNumber?: string;
  type?: string | null;
  description?: string | null;
  note?: string | null;
  createdAt?: string;
};

export type VehiclePagedResultDto = {
  items?: VehicleDto[];
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type VehicleUpsertRequestDto = {
  organizationId?: string | null;
  plateNumber?: string | null;
  type?: string | null;
  description?: string | null;
  note?: string | null;
};

export type VehicleFormData = {
  organizationId: string;
  plateNumber: string;
  type: VehicleTypeValue;
  description: string;
};
