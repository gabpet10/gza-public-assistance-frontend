import { apiClient } from "@/core/api/api-client";
import { mapPagedResultDto, toNullableTrimmed } from "@/core/api/normalization";
import { buildQueryString } from "@/core/api/query-string";
import type { QueryParameters } from "@/core/api/types";
import type {
  Client,
  ClientDto,
  ClientFormData,
  ClientPagedResultDto,
  ClientUpsertRequestDto,
} from "@/features/clients/api/types";

type SearchClientsInput = QueryParameters & {
  organizationId?: string;
};

function requireField<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Invalid clients payload: missing ${fieldName}`);
  }

  return value;
}

function toPayload(input: ClientFormData): ClientUpsertRequestDto {
  return {
    organizationId: toNullableTrimmed(input.organizationId),
    firstName: toNullableTrimmed(input.firstName),
    lastName: toNullableTrimmed(input.lastName),
    phone: toNullableTrimmed(input.phone),
    address: toNullableTrimmed(input.address),
    city: toNullableTrimmed(input.city),
    province: toNullableTrimmed(input.province),
    notes: toNullableTrimmed(input.notes),
  };
}

function toClientModel(dto: ClientDto): Client {
  return {
    id: requireField(dto.id, "client.id"),
    organizationId: requireField(dto.organizationId, "client.organizationId"),
    firstName: requireField(dto.firstName, "client.firstName"),
    lastName: requireField(dto.lastName, "client.lastName"),
    fullName: requireField(dto.fullName, "client.fullName"),
    phone: requireField(dto.phone, "client.phone"),
    address: requireField(dto.address, "client.address"),
    city: requireField(dto.city, "client.city"),
    province: requireField(dto.province, "client.province"),
    notes: requireField(dto.notes, "client.notes"),
    createdAt: requireField(dto.createdAt, "client.createdAt"),
  };
}

export async function searchClients({ ...parameters }: SearchClientsInput) {
  const query = buildQueryString(parameters);
  const response = await apiClient<ClientPagedResultDto>(
    `/api/bff/clients${query}`,
  );

  return mapPagedResultDto(response, toClientModel);
}

export async function createClient(input: ClientFormData) {
  const response = await apiClient<ClientDto>("/api/bff/clients", {
    method: "POST",
    body: JSON.stringify(toPayload(input)),
  });

  return toClientModel(response);
}

export async function updateClient(id: string, input: ClientFormData) {
  const response = await apiClient<ClientDto>(`/api/bff/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify(toPayload(input)),
  });

  return toClientModel(response);
}

export async function deleteClient(id: string) {
  return apiClient<void>(`/api/bff/clients/${id}`, {
    method: "DELETE",
  });
}
