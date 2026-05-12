import { apiClient } from "@/core/api/api-client";
import { mapPagedResultDto, toNullableTrimmed } from "@/core/api/normalization";
import { buildQueryString } from "@/core/api/query-string";
import type { QueryParameters } from "@/core/api/types";
import type {
  TransportSheet,
  TransportSheetDto,
  TransportSheetFormData,
  TransportSheetListItem,
  TransportSheetListItemDto,
  TransportSheetPagedResultDto,
  TransportSheetUpsertRequestDto,
} from "@/features/transport-services/api/transport-sheets-types";

type SearchTransportSheetsInput = QueryParameters & {
  organizationId?: string;
  transportServiceId?: string;
  reportDateFromUtc?: string;
  reportDateToUtc?: string;
};

const transportSheetsEndpoint = "/api/bff/transport-sheets";

function requireField<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Invalid transport-sheets payload: missing ${fieldName}`);
  }

  return value;
}

function toStringOrEmpty(value: string | null | undefined) {
  return value ?? "";
}

function toIntegerOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

function toPayload(
  input: TransportSheetFormData,
): TransportSheetUpsertRequestDto {
  return {
    organizationId: toNullableTrimmed(input.organizationId),
    reportDate: toNullableTrimmed(input.reportDate),
    destinationName: toNullableTrimmed(input.destinationName),
    destinationAddress: toNullableTrimmed(input.destinationAddress),
    destinationCity: toNullableTrimmed(input.destinationCity),
    destinationProvince: toNullableTrimmed(input.destinationProvince),
    destinationNotes: toNullableTrimmed(input.destinationNotes),
    clientFiscalCode: toNullableTrimmed(input.clientFiscalCode),
    clientFirstName: toNullableTrimmed(input.clientFirstName),
    clientLastName: toNullableTrimmed(input.clientLastName),
    clientPhone: toNullableTrimmed(input.clientPhone),
    clientAddress: toNullableTrimmed(input.clientAddress),
    clientCity: toNullableTrimmed(input.clientCity),
    clientProvince: toNullableTrimmed(input.clientProvince),
    clientAslNumber: toNullableTrimmed(input.clientAslNumber),
    clientAslMunicipality: toNullableTrimmed(input.clientAslMunicipality),
    clientNotes: toNullableTrimmed(input.clientNotes),
    vehiclePlate: toNullableTrimmed(input.vehiclePlate),
    startTime: toNullableTrimmed(input.startTime),
    endTime: toNullableTrimmed(input.endTime),
    kmDeparture: toIntegerOrNull(input.kmDeparture),
    kmArrival: toIntegerOrNull(input.kmArrival),
    notes: toNullableTrimmed(input.notes),
    volunteerIds: input.volunteerIds.length > 0 ? input.volunteerIds : null,
  };
}

function toTransportSheetModel(dto: TransportSheetDto): TransportSheet {
  const clientFirstName = toStringOrEmpty(dto.clientFirstName);
  const clientLastName = toStringOrEmpty(dto.clientLastName);

  return {
    id: dto.id ?? null,
    organizationId: toStringOrEmpty(dto.organizationId),
    transportServiceId: toStringOrEmpty(dto.transportServiceId),
    sheetNumber: dto.sheetNumber ?? null,
    reportDate: toStringOrEmpty(dto.reportDate),
    destinationName: toStringOrEmpty(dto.destinationName),
    destinationAddress: toStringOrEmpty(dto.destinationAddress),
    destinationCity: toStringOrEmpty(dto.destinationCity),
    destinationProvince: toStringOrEmpty(dto.destinationProvince),
    destinationNotes: toStringOrEmpty(dto.destinationNotes),
    clientFiscalCode: toStringOrEmpty(dto.clientFiscalCode),
    clientFirstName,
    clientLastName,
    clientFullName:
      dto.clientFullName ??
      [clientFirstName, clientLastName].filter(Boolean).join(" "),
    clientPhone: toStringOrEmpty(dto.clientPhone),
    clientAddress: toStringOrEmpty(dto.clientAddress),
    clientCity: toStringOrEmpty(dto.clientCity),
    clientProvince: toStringOrEmpty(dto.clientProvince),
    clientAslNumber: toStringOrEmpty(dto.clientAslNumber),
    clientAslMunicipality: toStringOrEmpty(dto.clientAslMunicipality),
    clientNotes: toStringOrEmpty(dto.clientNotes),
    vehiclePlate: toStringOrEmpty(dto.vehiclePlate),
    startTime: dto.startTime ?? null,
    endTime: dto.endTime ?? null,
    kmDeparture: dto.kmDeparture ?? null,
    kmArrival: dto.kmArrival ?? null,
    notes: toStringOrEmpty(dto.notes),
    createdAt: toStringOrEmpty(dto.createdAt),
    volunteerIds: dto.volunteerIds ?? [],
  };
}

function toTransportSheetListItemModel(
  dto: TransportSheetListItemDto,
): TransportSheetListItem {
  return {
    id: requireField(dto.id, "transportSheetListItem.id"),
    organizationId: requireField(
      dto.organizationId,
      "transportSheetListItem.organizationId",
    ),
    transportServiceId: requireField(
      dto.transportServiceId,
      "transportSheetListItem.transportServiceId",
    ),
    sheetNumber: requireField(
      dto.sheetNumber,
      "transportSheetListItem.sheetNumber",
    ),
    reportDate: requireField(
      dto.reportDate,
      "transportSheetListItem.reportDate",
    ),
    destinationName: requireField(
      dto.destinationName,
      "transportSheetListItem.destinationName",
    ),
    clientFiscalCode: requireField(
      dto.clientFiscalCode,
      "transportSheetListItem.clientFiscalCode",
    ),
    clientFullName: requireField(
      dto.clientFullName,
      "transportSheetListItem.clientFullName",
    ),
    vehiclePlate: requireField(
      dto.vehiclePlate,
      "transportSheetListItem.vehiclePlate",
    ),
    startTime: dto.startTime ?? null,
    endTime: dto.endTime ?? null,
    kmDeparture: dto.kmDeparture ?? null,
    kmArrival: dto.kmArrival ?? null,
    createdAt: requireField(dto.createdAt, "transportSheetListItem.createdAt"),
  };
}

export async function searchTransportSheets({
  ...parameters
}: SearchTransportSheetsInput) {
  const query = buildQueryString(parameters);
  const response = await apiClient<TransportSheetPagedResultDto>(
    `${transportSheetsEndpoint}${query}`,
  );

  return mapPagedResultDto(response, toTransportSheetListItemModel);
}

export async function createTransportSheet(
  transportServiceId: string,
  input: TransportSheetFormData,
) {
  const response = await apiClient<TransportSheetDto>(transportSheetsEndpoint, {
    method: "POST",
    body: JSON.stringify({
      transportServiceId,
      ...toPayload(input),
    }),
  });

  return toTransportSheetModel(response);
}

export async function getTransportSheetById(id: string) {
  const response = await apiClient<TransportSheetDto>(
    `${transportSheetsEndpoint}/${id}`,
  );

  return toTransportSheetModel(response);
}

export async function updateTransportSheet(
  id: string,
  input: TransportSheetFormData,
) {
  const response = await apiClient<TransportSheetDto>(
    `${transportSheetsEndpoint}/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(toPayload(input)),
    },
  );

  return toTransportSheetModel(response);
}

export async function deleteTransportSheet(id: string) {
  return apiClient<void>(`${transportSheetsEndpoint}/${id}`, {
    method: "DELETE",
  });
}

export async function initializeTransportSheetByTransportServiceId(
  transportServiceId: string,
) {
  const response = await apiClient<TransportSheetDto>(
    `${transportSheetsEndpoint}/initialize/${transportServiceId}`,
    {
      method: "POST",
    },
  );

  return toTransportSheetModel(response);
}

export async function getTransportSheetByTransportServiceId(
  transportServiceId: string,
) {
  const response = await apiClient<TransportSheetDto>(
    `${transportSheetsEndpoint}/by-transport-service/${transportServiceId}`,
  );

  return toTransportSheetModel(response);
}
