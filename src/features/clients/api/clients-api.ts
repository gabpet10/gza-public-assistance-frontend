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
    id: dto.id ?? "",
    organizationId: dto.organizationId ?? "",
    firstName: dto.firstName ?? null,
    lastName: dto.lastName ?? null,
    fullName: dto.fullName ?? null,
    phone: dto.phone ?? null,
    address: dto.address ?? null,
    city: dto.city ?? null,
    province: dto.province ?? null,
    notes: dto.notes ?? null,
    createdAt: dto.createdAt ?? "",
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
