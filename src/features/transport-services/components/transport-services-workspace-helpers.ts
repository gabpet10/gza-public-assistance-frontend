import dayjs from "dayjs";
import { ApiError } from "@/core/api/errors";
import type {
  TransportAssignmentRole,
  TransportCalendarEvent,
  TransportService,
  UpdateTransportServiceScheduleInput,
} from "@/features/transport-services/api/types";

type CalendarSchedulerView = "day" | "week" | "month" | "agenda";

type ConflictProblem = {
  type?: string;
  code?: string;
  detail?: string;
  startUtc?: string;
  endUtc?: string;
  resourceId?: string;
  conflictingServiceId?: string;
  expectedVersion?: number;
  currentVersion?: number;
};

const allowedTransportSortFields = new Set([
  "scheduledAt",
  "createdAt",
  "status",
]);
const defaultServiceDurationMs = 1000 * 60 * 60;

export function sanitizeTransportSortField(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return allowedTransportSortFields.has(value) ? value : undefined;
}

function toConflictProblem(error: unknown): ConflictProblem | undefined {
  if (error instanceof ApiError) {
    return error.problem as ConflictProblem | undefined;
  }

  if (error instanceof Error) {
    return (error as Error & { problem?: ConflictProblem }).problem;
  }

  return undefined;
}

function toConflictType(problem: ConflictProblem | undefined) {
  const raw = (problem?.type ?? problem?.code ?? "").trim().toLowerCase();
  if (!raw) {
    return "";
  }

  const fromUri = raw.split("/").filter(Boolean).at(-1);
  return fromUri ?? raw;
}

function formatConflictDateTime(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function toConflictMessage(error: unknown): string | null {
  const status =
    error instanceof ApiError
      ? error.status
      : error instanceof Error
        ? (error as Error & { status?: number }).status
        : undefined;

  if (status !== 409) {
    return null;
  }

  const problem = toConflictProblem(error);
  const conflictType = toConflictType(problem);
  const formattedStart = formatConflictDateTime(problem?.startUtc);
  const formattedEnd = formatConflictDateTime(problem?.endUtc);
  const timeWindow =
    formattedStart && formattedEnd
      ? `${formattedStart} - ${formattedEnd}`
      : null;
  const conflictingService = problem?.conflictingServiceId?.trim();
  const resourceId = problem?.resourceId?.trim();

  if (
    conflictType.includes("schedule_version_conflict") ||
    conflictType.includes("schedule_conflict")
  ) {
    return "Un altro operatore ha aggiornato la pianificazione. Ricarica i dati e riprova.";
  }

  if (conflictType.includes("vehicle_overlap")) {
    const serviceInfo = conflictingService
      ? ` Servizio in conflitto: ${conflictingService}.`
      : "";
    const rangeInfo = timeWindow ? ` Fascia oraria: ${timeWindow}.` : "";
    const vehicleInfo = resourceId ? ` Veicolo: ${resourceId}.` : "";
    return `Il veicolo selezionato risulta gia occupato.${vehicleInfo}${rangeInfo}${serviceInfo}`.trim();
  }

  if (conflictType.includes("volunteer_overlap")) {
    const serviceInfo = conflictingService
      ? ` Servizio in conflitto: ${conflictingService}.`
      : "";
    const rangeInfo = timeWindow ? ` Fascia oraria: ${timeWindow}.` : "";
    const volunteerInfo = resourceId ? ` Volontario: ${resourceId}.` : "";
    return `Il volontario selezionato risulta gia occupato.${volunteerInfo}${rangeInfo}${serviceInfo}`.trim();
  }

  if (problem?.detail?.trim()) {
    return problem.detail.trim();
  }

  return null;
}

export function toCalendarFetchWindow(
  view: CalendarSchedulerView,
  visibleDateIso: string,
) {
  const parsedVisibleDate = dayjs(visibleDateIso);
  const anchor = parsedVisibleDate.isValid() ? parsedVisibleDate : dayjs();

  if (view === "day") {
    return {
      startUtc: anchor.startOf("day").toISOString(),
      endUtc: anchor.endOf("day").toISOString(),
    };
  }

  if (view === "month") {
    return {
      startUtc: anchor.startOf("month").toISOString(),
      endUtc: anchor.endOf("month").toISOString(),
    };
  }

  if (view === "agenda") {
    const weekStart = anchor.startOf("week");
    return {
      startUtc: weekStart.toISOString(),
      endUtc: weekStart.endOf("week").add(3, "week").toISOString(),
    };
  }

  return {
    startUtc: anchor.startOf("week").toISOString(),
    endUtc: anchor.endOf("week").toISOString(),
  };
}

export function toUtcIsoOrUndefined(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = dayjs(trimmed);
  if (!parsed.isValid()) {
    return undefined;
  }

  return parsed.toISOString();
}

export function toAssignTeamMembers(
  volunteerIds: string[],
  volunteerRoles: TransportAssignmentRole[],
) {
  return volunteerIds.map((volunteerId, index) => ({
    volunteerId,
    role: volunteerRoles[index] ?? (index === 0 ? "driver" : "attendant"),
  }));
}

export function toServiceDurationMs(
  scheduledAt: string,
  scheduledEnd: string | null | undefined,
) {
  const startMs = new Date(scheduledAt).getTime();
  const endMs = scheduledEnd ? new Date(scheduledEnd).getTime() : Number.NaN;

  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
    return endMs - startMs;
  }

  return defaultServiceDurationMs;
}

export function toScheduleUpdatePayload(
  nextStartMs: number,
  durationMs: number,
  expectedVersion?: number,
): UpdateTransportServiceScheduleInput {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  return {
    scheduledAt: new Date(nextStartMs).toISOString(),
    scheduledEnd: new Date(nextStartMs + durationMs).toISOString(),
    timezone,
    expectedVersion,
  };
}

function pickDisplayLabel(
  detailLabel: string | null | undefined,
  entityId: string | null | undefined,
  gridLabel: string | null | undefined,
) {
  const normalizedDetail = detailLabel?.trim() ?? "";
  const normalizedEntityId = entityId?.trim() ?? "";
  const normalizedGrid = gridLabel?.trim() ?? "";

  const detailIsOnlyId =
    normalizedDetail.length > 0 &&
    normalizedEntityId.length > 0 &&
    normalizedDetail === normalizedEntityId;

  if (normalizedDetail.length > 0 && !detailIsOnlyId) {
    return normalizedDetail;
  }

  if (normalizedGrid.length > 0) {
    return normalizedGrid;
  }

  return normalizedDetail || null;
}

export function normalizeLookupLabel(
  label: string | null | undefined,
  entityId: string | null | undefined,
) {
  const normalizedLabel = label?.trim() ?? "";
  const normalizedEntityId = entityId?.trim() ?? "";

  if (!normalizedLabel) {
    return "";
  }

  if (normalizedEntityId && normalizedLabel === normalizedEntityId) {
    return "";
  }

  return normalizedLabel;
}

export function toServiceFallbackFromCalendarEvent(
  event: TransportCalendarEvent,
): TransportService {
  const volunteers = event.volunteers.map((volunteer) => ({ ...volunteer }));
  const assignedVolunteerIds = volunteers
    .map((volunteer) => volunteer.volunteerId.trim())
    .filter(Boolean);
  const assignedVolunteerNames = volunteers.map((volunteer) =>
    volunteer.fullName.trim(),
  );
  const fallbackClientName = [event.clientFirstName, event.clientLastName]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  const fallbackPickupDestination = [
    event.pickupDestinationAddress,
    event.pickupDestinationCity,
    event.pickupDestinationProvince,
  ]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" · ");
  const fallbackVehicleName = [
    event.vehicleDescription,
    event.vehiclePlateNumber,
    event.vehicleType,
  ]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" · ");

  const clientDisplayName =
    event.clientDisplayName ??
    event.clientFullName ??
    (fallbackClientName || event.clientId || "");
  const pickupDestinationDisplayName =
    event.pickupDestinationDisplayName ??
    event.pickupDestinationName ??
    (fallbackPickupDestination || event.pickupDestinationId || "");
  const vehicleDisplayName =
    event.vehicleDisplayName ??
    (fallbackVehicleName || event.vehicleId || null);

  return {
    id: event.id,
    organizationId: event.organizationId,
    transportType: event.transportType,
    status: event.status,
    scheduledAt: event.scheduledAt,
    scheduledEnd: event.scheduledEnd,
    scheduleVersion: event.scheduleVersion,
    clientId: event.clientId,
    clientDisplayName,
    pickupDestinationId: event.pickupDestinationId,
    pickupDestinationDisplayName,
    dropoffAddress: event.dropoffAddress,
    dropoffCity: event.dropoffCity,
    dropoffProvince: event.dropoffProvince,
    note: event.note,
    isPaid: event.isPaid,
    amount: event.amount,
    vehicleId: event.vehicleId,
    vehiclePlateNumber: event.vehiclePlateNumber,
    vehicleType: event.vehicleType,
    vehicleDisplayName,
    vehicleDescription: event.vehicleDescription,
    vehicleNote: event.vehicleNote,
    vehicleCreatedAt: event.vehicleCreatedAt,
    volunteers,
    assignedVolunteerIds,
    assignedVolunteerNames,
    teamMemberCount: event.teamMemberCount,
    acceptedAt: null,
    assignedAt: event.assignedAt,
    startedAt: null,
    completedAt: null,
    cancelledAt: event.cancelledAt,
    createdAt: event.createdAt,
  };
}

type MergeSelectionInput = {
  rows: TransportService[];
  selectedServiceFallback: TransportService | null;
  selectedServiceId: string | null;
};

export function mergeSelectedTransportService({
  rows,
  selectedServiceFallback,
  selectedServiceId,
}: MergeSelectionInput): TransportService | null {
  const selectedFromGrid = rows.find((item) => item.id === selectedServiceId);

  if (selectedServiceFallback?.id === selectedServiceId) {
    const selectedFromDetail = selectedServiceFallback;
    const mergedVolunteers =
      selectedFromDetail.volunteers.length > 0
        ? selectedFromDetail.volunteers
        : (selectedFromGrid?.volunteers ?? []);
    const detailHasPaymentData =
      selectedFromDetail.isPaid || selectedFromDetail.amount !== null;

    return {
      ...selectedFromDetail,
      clientId: selectedFromDetail.clientId,
      clientDisplayName:
        pickDisplayLabel(
          selectedFromDetail.clientDisplayName,
          selectedFromDetail.clientId,
          selectedFromGrid?.clientDisplayName,
        ) ?? "",
      pickupDestinationId: selectedFromDetail.pickupDestinationId,
      pickupDestinationDisplayName:
        pickDisplayLabel(
          selectedFromDetail.pickupDestinationDisplayName,
          selectedFromDetail.pickupDestinationId,
          selectedFromGrid?.pickupDestinationDisplayName,
        ) ?? "",
      vehicleId:
        selectedFromDetail.vehicleId ?? selectedFromGrid?.vehicleId ?? null,
      vehicleDisplayName: pickDisplayLabel(
        selectedFromDetail.vehicleDisplayName,
        selectedFromDetail.vehicleId,
        selectedFromGrid?.vehicleDisplayName,
      ),
      vehicleDescription:
        selectedFromDetail.vehicleDescription?.trim() ||
        selectedFromGrid?.vehicleDescription ||
        null,
      volunteers: mergedVolunteers,
      isPaid: detailHasPaymentData
        ? selectedFromDetail.isPaid
        : (selectedFromGrid?.isPaid ?? selectedFromDetail.isPaid),
      amount: detailHasPaymentData
        ? selectedFromDetail.amount
        : (selectedFromGrid?.amount ?? selectedFromDetail.amount),
    };
  }

  if (selectedFromGrid) {
    return selectedFromGrid;
  }

  return null;
}
