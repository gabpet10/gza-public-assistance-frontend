import { apiClient } from "@/core/api/api-client";
import { mapPagedResultDto, toNullableTrimmed } from "@/core/api/normalization";
import { buildQueryString } from "@/core/api/query-string";
import type { QueryParameters } from "@/core/api/types";
import type {
  Destination,
  DestinationDto,
  DestinationFormData,
  DestinationPagedResultDto,
  DestinationUpsertRequestDto,
} from "@/features/destinations/api/types";

type SearchDestinationsInput = QueryParameters & {
  organizationId?: string;
};

function requireField<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Invalid destinations payload: missing ${fieldName}`);
  }

  return value;
}

function toPayload(input: DestinationFormData): DestinationUpsertRequestDto {
  return {
    organizationId: toNullableTrimmed(input.organizationId),
    name: toNullableTrimmed(input.name),
    address: toNullableTrimmed(input.address),
    city: toNullableTrimmed(input.city),
    province: toNullableTrimmed(input.province),
    notes: toNullableTrimmed(input.notes),
  };
}

function toDestinationModel(dto: DestinationDto): Destination {
  return {
    id: requireField(dto.id, "destination.id"),
    organizationId: requireField(
      dto.organizationId,
      "destination.organizationId",
    ),
    name: requireField(dto.name, "destination.name"),
    address: requireField(dto.address, "destination.address"),
    city: requireField(dto.city, "destination.city"),
    province: requireField(dto.province, "destination.province"),
    notes: requireField(dto.notes, "destination.notes"),
    createdAt: requireField(dto.createdAt, "destination.createdAt"),
  };
}

export async function searchDestinations({
  ...parameters
}: SearchDestinationsInput) {
  const query = buildQueryString(parameters);
  const response = await apiClient<DestinationPagedResultDto>(
    `/api/bff/destinations${query}`,
  );

  return mapPagedResultDto(response, toDestinationModel);
}

export async function createDestination(input: DestinationFormData) {
  const response = await apiClient<DestinationDto>("/api/bff/destinations", {
    method: "POST",
    body: JSON.stringify(toPayload(input)),
  });

  return toDestinationModel(response);
}

export async function updateDestination(
  id: string,
  input: DestinationFormData,
) {
  const response = await apiClient<DestinationDto>(
    `/api/bff/destinations/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(toPayload(input)),
    },
  );

  return toDestinationModel(response);
}

export async function deleteDestination(id: string) {
  return apiClient<void>(`/api/bff/destinations/${id}`, {
    method: "DELETE",
  });
}
