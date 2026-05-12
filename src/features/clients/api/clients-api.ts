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
    fiscalCode: toNullableTrimmed(input.fiscalCode),
    firstName: toNullableTrimmed(input.firstName),
    lastName: toNullableTrimmed(input.lastName),
    phone: toNullableTrimmed(input.phone),
    address: toNullableTrimmed(input.address),
    city: toNullableTrimmed(input.city),
    province: toNullableTrimmed(input.province),
    aslNumber: toNullableTrimmed(input.aslNumber),
    aslMunicipality: toNullableTrimmed(input.aslMunicipality),
    notes: toNullableTrimmed(input.notes),
  };
}

function toClientModel(dto: ClientDto): Client {
  return {
    id: requireField(dto.id, "client.id"),
    organizationId: requireField(dto.organizationId, "client.organizationId"),
    fiscalCode: requireField(dto.fiscalCode, "client.fiscalCode"),
    firstName: dto.firstName ?? "",
    lastName: dto.lastName ?? "",
    fullName: requireField(dto.fullName, "client.fullName"),
    phone: dto.phone ?? "",
    address: dto.address ?? "",
    city: dto.city ?? "",
    province: dto.province ?? "",
    aslNumber: dto.aslNumber ?? "",
    aslMunicipality: dto.aslMunicipality ?? "",
    notes: dto.notes ?? "",
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
