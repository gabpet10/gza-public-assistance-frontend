import { apiClient } from "@/core/api/api-client";
import { mapPagedResultDto, toNullableTrimmed } from "@/core/api/normalization";
import { buildQueryString } from "@/core/api/query-string";
import type { QueryParameters } from "@/core/api/types";
import type {
  AssignVehicleAsVolunteerInput,
  AssignVehicleAsVolunteerRequestDto,
  AssignTransportServiceInput,
  AssignTransportServiceRequestDto,
  RescheduleTransportServiceInput,
  RescheduleTransportServiceRequestDto,
  SelfAssignTransportServiceInput,
  SelfAssignTransportServiceRequestDto,
  TransportAssignmentRole,
  TransportCalendarEvent,
  TransportCalendarEventDto,
  TransportService,
  TransportServiceDto,
  TransportServicePagedResultDto,
  TransportServiceVolunteer,
  TransportServiceVolunteerDto,
  TransportServiceStatus,
  TransportType,
  TransportServiceUpsertInput,
  TransportServiceUpsertRequestDto,
  UpdateTransportServiceScheduleInput,
  UpdateTransportServiceScheduleRequestDto,
} from "@/features/transport-services/api/types";

type SearchTransportServicesInput = QueryParameters & {
  organizationId?: string;
  status?: TransportServiceStatus;
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
  onlyOpen?: boolean;
  volunteerIds?: string[];
};

const transportServicesEndpoint = "/api/bff/transport-services";

function requireField<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Invalid transport-services payload: missing ${fieldName}`);
  }

  return value;
}

function requirePresent<T>(value: T | undefined, fieldName: string): T {
  if (value === undefined) {
    throw new Error(`Invalid transport-services payload: missing ${fieldName}`);
  }

  return value;
}

function toTransportAssignmentRole(
  value: string | undefined,
): TransportAssignmentRole {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "driver") {
    return "driver";
  }

  if (normalized === "attendant") {
    return "attendant";
  }

  throw new Error(
    `Invalid transport-services payload: unsupported assignment role ${value ?? "(empty)"}`,
  );
}

function toDisplayLabel(parts: Array<string | null | undefined>) {
  const label = parts
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" · ");

  return label.length > 0 ? label : null;
}

function toTransportServiceVolunteerModel(
  dto: TransportServiceVolunteerDto,
): TransportServiceVolunteer {
  const role = requireField(dto.role, "volunteer.role");
  const userId = requirePresent(dto.userId, "volunteer.userId");

  return {
    volunteerId: requireField(dto.volunteerId, "volunteer.volunteerId"),
    userId: userId ? userId.trim() : null,
    fullName: requireField(dto.fullName, "volunteer.fullName").trim(),
    phone: dto.phone?.trim() ?? null,
    role: toTransportAssignmentRole(role),
  };
}

function normalizeTransportStatus(
  value: string | undefined,
): TransportServiceStatus {
  const normalized = value?.trim().toUpperCase() ?? "";

  if (normalized === "PENDING") {
    return "pending";
  }

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

  throw new Error(
    `Invalid transport-services payload: unsupported status ${value ?? "(empty)"}`,
  );
}

function normalizeTransportType(value: string | undefined): TransportType {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (normalized === "sanitario") {
    return "sanitario";
  }

  if (normalized === "sociale") {
    return "sociale";
  }

  if (normalized === "dimissione_ospedaliera") {
    return "dimissione_ospedaliera";
  }

  if (normalized === "visita_programmata") {
    return "visita_programmata";
  }

  if (normalized === "dialisi") {
    return "dialisi";
  }

  if (normalized === "riabilitazione") {
    return "riabilitazione";
  }

  if (normalized === "trasferimento_struttura") {
    return "trasferimento_struttura";
  }

  if (normalized === "accompagnamento_amministrativo") {
    return "accompagnamento_amministrativo";
  }

  throw new Error(
    `Invalid transport-services payload: unsupported transportType ${value ?? "(empty)"}`,
  );
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
  const id = requireField(dto.id, "transportService.id");
  const organizationId = requireField(
    dto.organizationId,
    "transportService.organizationId",
  );
  const scheduledAt = requireField(
    dto.scheduledAt,
    "transportService.scheduledAt",
  );
  const scheduleVersion = requireField(
    dto.scheduleVersion,
    "transportService.scheduleVersion",
  );
  const clientId = requireField(dto.clientId, "transportService.clientId");
  const pickupDestinationId = requireField(
    dto.pickupDestinationId,
    "transportService.pickupDestinationId",
  );
  const dropoffAddress = requireField(
    dto.dropoffAddress,
    "transportService.dropoffAddress",
  );
  const dropoffCity = requireField(
    dto.dropoffCity,
    "transportService.dropoffCity",
  );
  const dropoffProvince = requireField(
    dto.dropoffProvince,
    "transportService.dropoffProvince",
  );
  const isPaid = requireField(dto.isPaid, "transportService.isPaid");
  const createdAt = requireField(dto.createdAt, "transportService.createdAt");
  const scheduledEnd = requireField(
    dto.scheduledEnd,
    "transportService.scheduledEnd",
  );
  const mappedVolunteers = requireField(
    dto.volunteers,
    "transportService.volunteers",
  ).map(toTransportServiceVolunteerModel);
  const volunteers = mappedVolunteers;
  const assignedVolunteerIds = volunteers.map(
    (volunteer) => volunteer.volunteerId,
  );
  const assignedVolunteerNames = volunteers.map(
    (volunteer) => volunteer.fullName,
  );

  const clientDisplayName =
    dto.clientDisplayName ??
    dto.clientFullName ??
    toDisplayLabel([dto.clientFirstName, dto.clientLastName]) ??
    clientId ??
    "";
  const pickupDestinationDisplayName =
    dto.pickupDestinationDisplayName ??
    dto.pickupDestinationName ??
    toDisplayLabel([
      dto.pickupDestinationAddress,
      dto.pickupDestinationCity,
      dto.pickupDestinationProvince,
    ]) ??
    pickupDestinationId ??
    "";
  const vehicleDisplayName =
    dto.vehicleDisplayName ??
    toDisplayLabel([
      dto.vehicleDescription,
      dto.vehiclePlateNumber,
      dto.vehicleType,
    ]) ??
    dto.vehicleId ??
    null;

  return {
    id,
    organizationId,
    transportType: normalizeTransportType(dto.transportType),
    status: normalizeTransportStatus(dto.status),
    scheduledAt,
    scheduledEnd,
    scheduleVersion,
    clientId,
    clientDisplayName,
    pickupDestinationId,
    pickupDestinationDisplayName,
    dropoffAddress,
    dropoffCity,
    dropoffProvince,
    note: dto.note ?? null,
    isPaid,
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
    teamMemberCount: dto.teamMemberCount ?? volunteers.length,
    acceptedAt: dto.acceptedAt ?? null,
    assignedAt: dto.assignedAt ?? null,
    startedAt: dto.startedAt ?? null,
    completedAt: dto.completedAt ?? null,
    cancelledAt: dto.cancelledAt ?? null,
    createdAt,
  };
}

function toTransportCalendarEventModel(
  dto: TransportCalendarEventDto,
): TransportCalendarEvent {
  const id = requireField(dto.id, "calendarEvent.id");
  const organizationId = requireField(
    dto.organizationId,
    "calendarEvent.organizationId",
  );
  const clientId = requireField(dto.clientId, "calendarEvent.clientId");
  const pickupDestinationId = requireField(
    dto.pickupDestinationId,
    "calendarEvent.pickupDestinationId",
  );
  const dropoffAddress = requireField(
    dto.dropoffAddress,
    "calendarEvent.dropoffAddress",
  );
  const dropoffCity = requireField(
    dto.dropoffCity,
    "calendarEvent.dropoffCity",
  );
  const dropoffProvince = requireField(
    dto.dropoffProvince,
    "calendarEvent.dropoffProvince",
  );
  const title = requireField(dto.title, "calendarEvent.title");
  const scheduledAt = requireField(
    dto.scheduledAt,
    "calendarEvent.scheduledAt",
  );
  const scheduledEnd = requireField(
    dto.scheduledEnd,
    "calendarEvent.scheduledEnd",
  );
  const scheduleVersion = requireField(
    dto.scheduleVersion,
    "calendarEvent.scheduleVersion",
  );
  const isPaid = requireField(dto.isPaid, "calendarEvent.isPaid");
  const teamMemberCount = requireField(
    dto.teamMemberCount,
    "calendarEvent.teamMemberCount",
  );
  const createdAt = requireField(dto.createdAt, "calendarEvent.createdAt");
  const canMove = requireField(dto.canMove, "calendarEvent.canMove");
  const canAssign = requireField(dto.canAssign, "calendarEvent.canAssign");
  const canCancel = requireField(dto.canCancel, "calendarEvent.canCancel");
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
  const volunteers = requireField(
    dto.volunteers,
    "calendarEvent.volunteers",
  ).map(toTransportServiceVolunteerModel);

  return {
    id,
    organizationId,
    transportType: normalizeTransportType(dto.transportType),
    clientId,
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
    pickupDestinationId,
    pickupDestinationName: dto.pickupDestinationName ?? null,
    pickupDestinationDescription: dto.pickupDestinationDescription ?? null,
    pickupDestinationAddress: dto.pickupDestinationAddress ?? null,
    pickupDestinationCity: dto.pickupDestinationCity ?? null,
    pickupDestinationProvince: dto.pickupDestinationProvince ?? null,
    pickupDestinationNotes: dto.pickupDestinationNotes ?? null,
    pickupDestinationCreatedAt: dto.pickupDestinationCreatedAt ?? null,
    pickupDestinationDisplayName,
    dropoffAddress,
    dropoffCity,
    dropoffProvince,
    title,
    scheduledAt,
    scheduledEnd,
    scheduleVersion,
    status: normalizeTransportStatus(dto.status),
    note: dto.note ?? null,
    isPaid,
    amount: dto.amount ?? null,
    vehicleId: dto.vehicleId ?? null,
    vehiclePlateNumber: dto.vehiclePlateNumber ?? null,
    vehicleType: dto.vehicleType ?? null,
    vehicleDescription: dto.vehicleDescription ?? null,
    vehicleNote: dto.vehicleNote ?? null,
    vehicleCreatedAt: dto.vehicleCreatedAt ?? null,
    vehicleDisplayName,
    volunteers,
    teamMemberCount,
    createdAt,
    assignedAt: dto.assignedAt ?? null,
    cancelledAt: dto.cancelledAt ?? null,
    canMove,
    canAssign,
    canCancel,
  };
}

function toUpsertPayload(
  input: TransportServiceUpsertInput,
): TransportServiceUpsertRequestDto {
  return {
    organizationId: toNullableTrimmed(input.organizationId),
    clientId: toNullableTrimmed(input.clientId),
    pickupDestinationId: toNullableTrimmed(input.pickupDestinationId),
    transportType: toNullableTrimmed(input.transportType),
    scheduledAt: toNullableTrimmed(input.scheduledAt),
    scheduledEnd: toNullableTrimmed(input.scheduledEnd),
    dropoffAddress: toNullableTrimmed(input.dropoffAddress),
    dropoffCity: toNullableTrimmed(input.dropoffCity),
    dropoffProvince: toNullableTrimmed(input.dropoffProvince),
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
    teamMembers: input.teamMembers.map((member) => ({
      volunteerId: toNullableTrimmed(member.volunteerId),
      role: toNullableTrimmed(member.role),
    })),
    note: toNullableTrimmed(input.note),
    assignedAt: toNullableTrimmed(input.assignedAt),
  };
}

function toSelfAssignPayload(
  input: SelfAssignTransportServiceInput,
): SelfAssignTransportServiceRequestDto {
  return {
    role: toNullableTrimmed(input.role),
    assignedAt: toNullableTrimmed(input.assignedAt),
  };
}

function toAssignVehicleAsVolunteerPayload(
  input: AssignVehicleAsVolunteerInput,
): AssignVehicleAsVolunteerRequestDto {
  return {
    vehicleId: toNullableTrimmed(input.vehicleId),
    note: toNullableTrimmed(input.note),
    changedAt: toNullableTrimmed(input.changedAt),
  };
}

function toReschedulePayload(
  input: RescheduleTransportServiceInput,
): RescheduleTransportServiceRequestDto {
  return {
    scheduledAtUtc: toNullableTrimmed(input.scheduledAt),
  };
}

function toUpdateSchedulePayload(
  input: UpdateTransportServiceScheduleInput,
): UpdateTransportServiceScheduleRequestDto {
  return {
    startUtc: toNullableTrimmed(input.scheduledAt),
    endUtc: toNullableTrimmed(input.scheduledEnd),
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

export async function selfAssignVolunteerToTransportService(
  id: string,
  input: SelfAssignTransportServiceInput,
) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/me/assign`,
    {
      method: "POST",
      body: JSON.stringify(toSelfAssignPayload(input)),
    },
  );

  return toTransportServiceModel(response);
}

export async function selfRemoveVolunteerFromTransportService(id: string) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/me/assign`,
    {
      method: "DELETE",
    },
  );

  return toTransportServiceModel(response);
}

export async function selfAssignVehicleToTransportService(
  id: string,
  input: AssignVehicleAsVolunteerInput,
) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/me/vehicle`,
    {
      method: "PUT",
      body: JSON.stringify(toAssignVehicleAsVolunteerPayload(input)),
    },
  );

  return toTransportServiceModel(response);
}

export async function selfRemoveVehicleFromTransportService(id: string) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/me/vehicle`,
    {
      method: "DELETE",
    },
  );

  return toTransportServiceModel(response);
}

export async function removeVolunteerFromTransportService(
  id: string,
  volunteerId: string,
) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/volunteers/${volunteerId}`,
    {
      method: "DELETE",
    },
  );

  return toTransportServiceModel(response);
}

export async function removeVehicleFromTransportService(id: string) {
  const response = await apiClient<TransportServiceDto>(
    `${transportServicesEndpoint}/${id}/vehicle`,
    {
      method: "DELETE",
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
