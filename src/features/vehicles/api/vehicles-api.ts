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

function toPayload(input: VehicleFormData): VehicleUpsertRequestDto {
  const normalizedDescription = toNullableTrimmed(input.description);

  return {
    organizationId: toNullableTrimmed(input.organizationId),
    plateNumber: toNullableTrimmed(input.plateNumber),
    type: toNullableTrimmed(normalizeVehicleType(input.type) ?? input.type),
    description: normalizedDescription,
    note: normalizedDescription,
  };
}

function toVehicleModel(dto: VehicleDto): Vehicle {
  const normalizedType = normalizeVehicleType(dto.type);

  return {
    id: dto.id ?? "",
    organizationId: dto.organizationId ?? "",
    plateNumber: dto.plateNumber ?? "",
    type: normalizedType ?? null,
    description: dto.description ?? dto.note ?? null,
    createdAt: dto.createdAt ?? "",
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
