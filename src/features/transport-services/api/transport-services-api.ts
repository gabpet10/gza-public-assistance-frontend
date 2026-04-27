import { apiClient } from "@/core/api/api-client";
import { mapPagedResultDto, toNullableTrimmed } from "@/core/api/normalization";
import { buildQueryString } from "@/core/api/query-string";
import type { QueryParameters } from "@/core/api/types";
import type {
  AssignTransportServiceInput,
  AssignTransportServiceRequestDto,
  RescheduleTransportServiceInput,
  RescheduleTransportServiceRequestDto,
  TransportAssignmentRole,
  TransportCalendarEvent,
  TransportCalendarEventDto,
  TransportPriority,
  TransportService,
  TransportServiceDto,
  TransportServicePagedResultDto,
  TransportServiceVolunteer,
  TransportServiceVolunteerDto,
  TransportServiceStatus,
  TransportServiceUpsertInput,
  TransportServiceUpsertRequestDto,
  UpdateTransportServiceScheduleInput,
  UpdateTransportServiceScheduleRequestDto,
} from "@/features/transport-services/api/types";

type SearchTransportServicesInput = QueryParameters & {
  organizationId?: string;
  status?: TransportServiceStatus;
  priority?: TransportPriority;
  onlyOpen?: boolean;
  rangeStartUtc?: string;
  rangeEndUtc?: string;
  volunteerIds?: string[];
};

type CalendarEventsInput = {
  organizationId?: string;
  startUtc?: string;
  endUtc?: string;
  status?: TransportServiceStatus;
  priority?: TransportPriority;
  onlyOpen?: boolean;
  volunteerIds?: string[];
};

const transportServicesEndpoint = "/api/bff/TransportServices";

function toTransportAssignmentRole(
  value: string | undefined,
): TransportAssignmentRole {
  const normalized = value?.trim().toLowerCase();
  return normalized === "driver" ? "driver" : "attendant";
}

function toDisplayLabel(parts: Array<string | null | undefined>) {
  const label = parts
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" · ");

  return label.length > 0 ? label : null;
}

function toVolunteerNamesArray(
  names: string[] | null | undefined,
  fallbackCsv: string | null | undefined,
) {
  if (Array.isArray(names) && names.length > 0) {
    return names.map((name) => name.trim()).filter(Boolean);
  }

  if (!fallbackCsv) {
    return [];
  }

  return fallbackCsv
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function toTransportServiceVolunteerModel(
  dto: TransportServiceVolunteerDto,
): TransportServiceVolunteer {
  return {
    volunteerId: dto.volunteerId ?? "",
    fullName: dto.fullName?.trim() ?? "",
    role: toTransportAssignmentRole(dto.role),
  };
}

function normalizeTransportStatus(
  value: string | undefined,
): TransportServiceStatus {
  const normalized = value?.trim().toUpperCase() ?? "";

  if (normalized === "ACCEPTED") {
    return "accepted";
  }

  if (normalized === "ASSIGNED") {
    return "assigned";
  }

  if (normalized === "IN_PROGRESS") {
    return "in_progress";
  }

  if (normalized === "COMPLETED") {
    return "completed";
  }

  if (normalized === "CANCELLED" || normalized === "CANCELED") {
    return "cancelled";
  }

  return "pending";
}

function normalizeTransportPriority(
  value: string | undefined,
): TransportPriority {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (
    normalized === "urgent" ||
    normalized === "high" ||
    normalized === "critical"
  ) {
    return "urgent";
  }

  return "routine";
}

function toApiTransportStatus(
  value: TransportServiceStatus | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return value;
}

function toTransportServiceModel(dto: TransportServiceDto): TransportService {
  const scheduledAt = dto.scheduledAt ?? dto.startUtc ?? "";
  const scheduledEnd =
    dto.scheduledEnd ?? dto.scheduledEndAt ?? dto.endUtc ?? null;
  const mappedVolunteers = (dto.volunteers ?? []).map(
    toTransportServiceVolunteerModel,
  );
  const volunteerIds = [...(dto.assignedVolunteerIds ?? [])]
    .map((id) => id.trim())
    .filter(Boolean);
  const uniqueVolunteerIds = Array.from(new Set(volunteerIds));
  const volunteerNames = toVolunteerNamesArray(
    dto.assignedVolunteerNames,
    dto.volunteerNames,
  );
  const fallbackVolunteers: TransportServiceVolunteer[] =
    uniqueVolunteerIds.map((volunteerId, index) => ({
      volunteerId,
      fullName: volunteerNames[index] ?? "",
      role: index === 0 ? "driver" : "attendant",
    }));
  const volunteers =
    mappedVolunteers.length > 0 ? mappedVolunteers : fallbackVolunteers;
  const assignedVolunteerIds =
    uniqueVolunteerIds.length > 0
      ? uniqueVolunteerIds
      : volunteers.map((volunteer) => volunteer.volunteerId);
  const assignedVolunteerNames =
    volunteerNames.length > 0
      ? volunteerNames
      : volunteers.map((volunteer) => volunteer.fullName);

  const clientDisplayName =
    dto.clientDisplayName ??
    dto.clientFullName ??
    toDisplayLabel([dto.clientFirstName, dto.clientLastName]) ??
    dto.clientId ??
    null;
  const pickupDestinationDisplayName =
    dto.pickupDestinationDisplayName ??
    dto.pickupDestinationName ??
    toDisplayLabel([
      dto.pickupDestinationAddress,
      dto.pickupDestinationCity,
      dto.pickupDestinationProvince,
    ]) ??
    dto.pickupDestinationId ??
    null;
  const vehicleDisplayName =
    dto.vehicleDisplayName ??
    toDisplayLabel([
      dto.vehicleDescription,
      dto.vehiclePlateNumber,
      dto.vehicleType,
    ]) ??
    dto.vehicleId ??
    null;

  const fallbackTeamCount = Math.max(
    volunteers.length,
    uniqueVolunteerIds.length,
    volunteerNames.length,
  );

  return {
    id: dto.id ?? "",
    organizationId: dto.organizationId ?? "",
    status: normalizeTransportStatus(dto.status),
    priority: normalizeTransportPriority(dto.priority),
    scheduledAt,
    scheduledEnd,
    scheduleVersion: dto.scheduleVersion ?? 0,
    clientId: dto.clientId ?? null,
    clientDisplayName,
    pickupDestinationId: dto.pickupDestinationId ?? null,
    pickupDestinationDisplayName,
    dropoffAddress: dto.dropoffAddress ?? null,
    dropoffCity: dto.dropoffCity ?? null,
    dropoffProvince: dto.dropoffProvince ?? null,
    note: dto.note ?? null,
    isPaid: dto.isPaid ?? false,
    amount: dto.amount ?? null,
    vehicleId: dto.vehicleId ?? null,
    vehiclePlateNumber: dto.vehiclePlateNumber ?? null,
    vehicleType: dto.vehicleType ?? null,
    vehicleDisplayName,
    vehicleDescription: dto.vehicleDescription ?? null,
    vehicleNote: dto.vehicleNote ?? null,
    vehicleCreatedAt: dto.vehicleCreatedAt ?? null,
    volunteers,
    assignedVolunteerIds,
    assignedVolunteerNames,
    teamMemberCount: dto.teamMemberCount ?? fallbackTeamCount,
    acceptedAt: dto.acceptedAt ?? null,
    assignedAt: dto.assignedAt ?? null,
    startedAt: dto.startedAt ?? null,
    completedAt: dto.completedAt ?? null,
    cancelledAt: dto.cancelledAt ?? null,
    createdAt: dto.createdAt ?? "",
  };
}

function toTransportCalendarEventModel(
  dto: TransportCalendarEventDto,
): TransportCalendarEvent {
  const scheduledAt = dto.scheduledAt ?? dto.startUtc ?? "";
  const scheduledEnd =
    dto.scheduledEnd ?? dto.scheduledEndUtc ?? dto.endUtc ?? null;
  const clientDisplayName =
    dto.clientDisplayName ??
    dto.clientFullName ??
    toDisplayLabel([dto.clientFirstName, dto.clientLastName]);
  const pickupDestinationDisplayName =
    dto.pickupDestinationDisplayName ??
    dto.pickupDestinationName ??
    toDisplayLabel([
      dto.pickupDestinationAddress,
      dto.pickupDestinationCity,
      dto.pickupDestinationProvince,
    ]);
  const vehicleDisplayName =
    dto.vehicleDisplayName ??
    toDisplayLabel([
      dto.vehicleDescription,
      dto.vehiclePlateNumber,
      dto.vehicleType,
    ]);
  const volunteers = (dto.volunteers ?? []).map(
    toTransportServiceVolunteerModel,
  );

  const fallbackTeamCount = volunteers.length;

  return {
    id: dto.id ?? "",
    organizationId: dto.organizationId ?? "",
    clientId: dto.clientId ?? "",
    clientFirstName: dto.clientFirstName ?? null,
    clientLastName: dto.clientLastName ?? null,
    clientFullName: dto.clientFullName ?? null,
    clientPhone: dto.clientPhone ?? null,
    clientAddress: dto.clientAddress ?? null,
    clientCity: dto.clientCity ?? null,
    clientProvince: dto.clientProvince ?? null,
    clientNotes: dto.clientNotes ?? null,
    clientCreatedAt: dto.clientCreatedAt ?? null,
    clientDisplayName,
    pickupDestinationId: dto.pickupDestinationId ?? "",
    pickupDestinationName: dto.pickupDestinationName ?? null,
    pickupDestinationDescription: dto.pickupDestinationDescription ?? null,
    pickupDestinationAddress: dto.pickupDestinationAddress ?? null,
    pickupDestinationCity: dto.pickupDestinationCity ?? null,
    pickupDestinationProvince: dto.pickupDestinationProvince ?? null,
    pickupDestinationNotes: dto.pickupDestinationNotes ?? null,
    pickupDestinationCreatedAt: dto.pickupDestinationCreatedAt ?? null,
    pickupDestinationDisplayName,
    dropoffAddress: dto.dropoffAddress ?? "",
    dropoffCity: dto.dropoffCity ?? "",
    dropoffProvince: dto.dropoffProvince ?? "",
    title: dto.title ?? "",
    scheduledAt,
    scheduledEnd,
    scheduleVersion: dto.scheduleVersion ?? 0,
    status: normalizeTransportStatus(dto.status),
    priority: normalizeTransportPriority(dto.priority),
    note: dto.note ?? null,
    isPaid: dto.isPaid ?? false,
    amount: dto.amount ?? null,
    vehicleId: dto.vehicleId ?? null,
    vehiclePlateNumber: dto.vehiclePlateNumber ?? null,
    vehicleType: dto.vehicleType ?? null,
    vehicleDescription: dto.vehicleDescription ?? null,
    vehicleNote: dto.vehicleNote ?? null,
    vehicleCreatedAt: dto.vehicleCreatedAt ?? null,
    vehicleDisplayName,
    volunteers,
    teamMemberCount: dto.teamMemberCount ?? fallbackTeamCount,
    createdAt: dto.createdAt ?? "",
    assignedAt: dto.assignedAt ?? null,
    cancelledAt: dto.cancelledAt ?? null,
    canMove: dto.canMove ?? false,
    canAssign: dto.canAssign ?? false,
    canCancel: dto.canCancel ?? false,
  };
}

function toUpsertPayload(
  input: TransportServiceUpsertInput,
): TransportServiceUpsertRequestDto {
  return {
    organizationId: toNullableTrimmed(input.organizationId),
    clientId: toNullableTrimmed(input.clientId),
    pickupDestinationId: toNullableTrimmed(input.pickupDestinationId),
    scheduledAt: toNullableTrimmed(input.scheduledAt),
    scheduledEnd: toNullableTrimmed(input.scheduledEnd),
    dropoffAddress: toNullableTrimmed(input.dropoffAddress),
    dropoffCity: toNullableTrimmed(input.dropoffCity),
    dropoffProvince: toNullableTrimmed(input.dropoffProvince),
    priority: toNullableTrimmed(input.priority),
    isPaid: input.isPaid,
    amount: input.isPaid ? (input.amount ?? null) : null,
    note: toNullableTrimmed(input.note),
  };
}

function toAssignPayload(
  input: AssignTransportServiceInput,
): AssignTransportServiceRequestDto {
  return {
    vehicleId: toNullableTrimmed(input.vehicleId),
    assignedByUserId: toNullableTrimmed(input.assignedByUserId),
    teamMembers: input.teamMembers.map((member) => ({
      volunteerId: toNullableTrimmed(member.volunteerId),
      role: toNullableTrimmed(member.role),
    })),
    note: toNullableTrimmed(input.note),
    assignedAt: toNullableTrimmed(input.assignedAt),
  };
}

function toReschedulePayload(
  input: RescheduleTransportServiceInput,
): RescheduleTransportServiceRequestDto {
  return {
    scheduledAt: toNullableTrimmed(input.scheduledAt),
  };
}

function toUpdateSchedulePayload(
  input: UpdateTransportServiceScheduleInput,
): UpdateTransportServiceScheduleRequestDto {
  return {
    scheduledAt: toNullableTrimmed(input.scheduledAt),
    scheduledEnd: toNullableTrimmed(input.scheduledEnd),
    timezone: toNullableTrimmed(input.timezone),
    expectedVersion:
      typeof input.expectedVersion === "number" ? input.expectedVersion : null,
  };
}

export async function searchTransportServices({
  ...parameters
}: SearchTransportServicesInput) {
  const query = buildQueryString({
    ...parameters,
    status: toApiTransportStatus(parameters.status),
  });
  const response = await apiClient<TransportServicePagedResultDto>(
    `${transportServicesEndpoint}${query}`,
  );

  return mapPagedResultDto(response, toTransportServiceModel);
}

export async function getTransportServiceById(id: string) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}`,
  );

  return toTransportServiceModel(response);
}

export async function createTransportService(
  input: TransportServiceUpsertInput,
) {
  const response = await apiClient<TransportServiceDto>(
    transportServicesEndpoint,
    {
      method: "POST",
      body: JSON.stringify(toUpsertPayload(input)),
    },
  );

  return toTransportServiceModel(response);
}

export async function updateTransportService(
  id: string,
  input: TransportServiceUpsertInput,
) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(toUpsertPayload(input)),
    },
  );

  return toTransportServiceModel(response);
}

export async function deleteTransportService(id: string) {
  return apiClient<void>(`${transportServicesEndpoint}/${id}`, {
    method: "DELETE",
  });
}

export async function acceptTransportService(id: string) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/accept`,
    {
      method: "POST",
    },
  );

  return toTransportServiceModel(response);
}

export async function assignTransportService(
  id: string,
  input: AssignTransportServiceInput,
) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/assign`,
    {
      method: "POST",
      body: JSON.stringify(toAssignPayload(input)),
    },
  );

  return toTransportServiceModel(response);
}

export async function startTransportService(id: string) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/start`,
    {
      method: "POST",
    },
  );

  return toTransportServiceModel(response);
}

export async function completeTransportService(id: string) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/complete`,
    {
      method: "POST",
    },
  );

  return toTransportServiceModel(response);
}

export async function cancelTransportService(id: string) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/cancel`,
    {
      method: "POST",
    },
  );

  return toTransportServiceModel(response);
}

export async function rescheduleTransportService(
  id: string,
  input: RescheduleTransportServiceInput,
) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/reschedule`,
    {
      method: "POST",
      body: JSON.stringify(toReschedulePayload(input)),
    },
  );

  return toTransportServiceModel(response);
}

export async function updateTransportServiceSchedule(
  id: string,
  input: UpdateTransportServiceScheduleInput,
) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/schedule`,
    {
      method: "PATCH",
      body: JSON.stringify(toUpdateSchedulePayload(input)),
    },
  );

  return toTransportServiceModel(response);
}

export async function getTransportCalendarEvents({
  ...parameters
}: CalendarEventsInput) {
  const query = buildQueryString({
    ...parameters,
    status: toApiTransportStatus(parameters.status),
  });
  const response = await apiClient<TransportCalendarEventDto[]>(
    `${transportServicesEndpoint}/calendar-events${query}`,
  );

  return response.map(toTransportCalendarEventModel);
}
