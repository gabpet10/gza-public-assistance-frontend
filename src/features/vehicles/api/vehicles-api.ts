import { apiClient } from "@/core/api/api-client";
import { mapPagedResultDto, toNullableTrimmed } from "@/core/api/normalization";
import { buildQueryString } from "@/core/api/query-string";
import type { QueryParameters } from "@/core/api/types";
import type {
  Vehicle,
  VehicleDto,
  VehicleFormData,
  VehiclePagedResultDto,
  VehicleUpsertRequestDto,
} from "@/features/vehicles/api/types";
import { normalizeVehicleType } from "@/features/vehicles/api/types";

type SearchVehiclesInput = QueryParameters & {
  organizationId?: string;
};

function requireField<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Invalid vehicles payload: missing ${fieldName}`);
  }

  return value;
}

function toPayload(input: VehicleFormData): VehicleUpsertRequestDto {
  const normalizedDescription = toNullableTrimmed(input.description);

  return {
    organizationId: toNullableTrimmed(input.organizationId),
    plateNumber: toNullableTrimmed(input.plateNumber),
    type: toNullableTrimmed(normalizeVehicleType(input.type) ?? input.type),
    description: normalizedDescription,
    note: null,
  };
}

function toVehicleModel(dto: VehicleDto): Vehicle {
  const rawType = requireField(dto.type, "vehicle.type");
  const normalizedType = normalizeVehicleType(rawType);

  if (!normalizedType) {
    throw new Error(`Invalid vehicles payload: unsupported type ${rawType}`);
  }

  return {
    id: requireField(dto.id, "vehicle.id"),
    organizationId: requireField(dto.organizationId, "vehicle.organizationId"),
    plateNumber: requireField(dto.plateNumber, "vehicle.plateNumber"),
    type: normalizedType,
    description: requireField(dto.description, "vehicle.description"),
    note: requireField(dto.note, "vehicle.note"),
    createdAt: requireField(dto.createdAt, "vehicle.createdAt"),
  };
}

export async function searchVehicles({ ...parameters }: SearchVehiclesInput) {
  const query = buildQueryString(parameters);
  const response = await apiClient<VehiclePagedResultDto>(
    `/api/bff/vehicles${query}`,
  );

  return mapPagedResultDto(response, toVehicleModel);
}

export async function createVehicle(input: VehicleFormData) {
  const response = await apiClient<VehicleDto>("/api/bff/vehicles", {
    method: "POST",
    body: JSON.stringify(toPayload(input)),
  });

  return toVehicleModel(response);
}

export async function updateVehicle(id: string, input: VehicleFormData) {
  const response = await apiClient<VehicleDto>(`/api/bff/vehicles/${id}`, {
    method: "PUT",
    body: JSON.stringify(toPayload(input)),
  });

  return toVehicleModel(response);
}

export async function deleteVehicle(id: string) {
  return apiClient<void>(`/api/bff/vehicles/${id}`, {
    method: "DELETE",
  });
}
