"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Add,
  CalendarMonth,
  DeleteOutline,
  Edit,
  ExpandLess,
  ExpandMore,
  EventRepeat,
  GroupAdd,
  LocalShipping,
  ViewList,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import type { GridRowParams } from "@mui/x-data-grid";
import { ApiError, getErrorMessage, toApiUiError } from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import {
  acceptTransportService,
  assignTransportService,
  cancelTransportService,
  completeTransportService,
  createTransportService,
  deleteTransportService,
  getTransportServiceById,
  getTransportCalendarEvents,
  searchTransportServices,
  startTransportService,
  updateTransportServiceSchedule,
  updateTransportService,
} from "@/features/transport-services/api/transport-services-api";
import { searchClients } from "@/features/clients/api/clients-api";
import { searchDestinations } from "@/features/destinations/api/destinations-api";
import { searchVehicles } from "@/features/vehicles/api/vehicles-api";
import { toVehicleTypeLabel } from "@/features/vehicles/api/types";
import { searchVolunteers } from "@/features/volunteers/api/volunteers-api";
import type {
  TransportAssignmentRole,
  TransportPriority,
  TransportCalendarEvent,
  TransportServiceFormData,
  TransportService,
  TransportServiceStatus,
} from "@/features/transport-services/api/types";
import type {
  LookupOption,
  LookupSearchInput,
  LookupSearchResult,
} from "@/shared/ui/entity-lookup-dialog-field";
import { EntityLookupDialogField } from "@/shared/ui/entity-lookup-dialog-field";
import { TransportServiceFormDialog } from "@/features/transport-services/components/transport-service-form-dialog";
import { TransportServicesCalendar } from "@/features/transport-services/components/transport-services-calendar";
import { TransportServicesGrid } from "@/features/transport-services/components/transport-services-grid";
import { useServerGridState } from "@/shared/hooks/use-server-grid-state";
import {
  useConfirmActionState,
  useDialogState,
} from "@/shared/hooks/use-dialog-confirm-state";
import { ConfirmActionDialog } from "@/shared/ui/confirm-action-dialog";
import { ContentCard } from "@/shared/ui/content-card";
import { ErrorState, LoadingState } from "@/shared/ui/feedback-states";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";
import {
  workspaceHeaderIconSx,
  workspacePrimaryActionButtonSx,
  workspaceViewToggleGroupSx,
} from "@/shared/ui/workspace-styles";
import { TransportServiceDetailPanel } from "./transport-service-detail-panel";

type WorkspaceView = "grid" | "calendar";
type TransportStatusFilter = "OPEN" | TransportServiceStatus;
type TransportPriorityFilter = "all" | TransportPriority;
type CalendarSchedulerView = "day" | "week" | "month" | "agenda";

type AssignDialogMember = {
  volunteerId: string;
  label: string;
  role: TransportAssignmentRole;
};

const statusFilterOptions: Array<{
  value: TransportStatusFilter;
  label: string;
}> = [
  { value: "OPEN", label: "Aperti" },
  { value: "pending", label: "In attesa" },
  { value: "accepted", label: "Accettato" },
  { value: "assigned", label: "Assegnato" },
  { value: "in_progress", label: "In corso" },
  { value: "completed", label: "Completato" },
  { value: "cancelled", label: "Annullato" },
];

const priorityFilterOptions: Array<{
  value: TransportPriorityFilter;
  label: string;
}> = [
  { value: "all", label: "Tutte le priorita" },
  { value: "routine", label: "Ordinaria" },
  { value: "urgent", label: "Urgente" },
];

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

function toConflictMessage(error: unknown): string | null {
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
    conflictType.includes("version_conflict")
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

function toCalendarFetchWindow(
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

function toUtcIsoOrUndefined(value: string) {
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

export function TransportServicesWorkspace() {
  const { session } = useAuth();
  const scopedOrganizationId =
    session?.activeOrganizationId ??
    session?.memberships?.[0]?.organizationId ??
    undefined;
  const {
    searchText,
    debouncedSearchText,
    paginationModel,
    sortModel,
    setSearchText,
    handlePaginationModelChange,
    handleSortModelChange,
  } = useServerGridState();
  const [activeView, setActiveView] = useState<WorkspaceView>("grid");
  const [statusFilter, setStatusFilter] =
    useState<TransportStatusFilter>("OPEN");
  const [priorityFilter, setPriorityFilter] =
    useState<TransportPriorityFilter>("all");
  const [volunteerFilterIds, setVolunteerFilterIds] = useState<string[]>([]);
  const [volunteerFilterLabels, setVolunteerFilterLabels] = useState<string[]>(
    [],
  );
  const [isGridAdvancedFiltersOpen, setIsGridAdvancedFiltersOpen] =
    useState(false);
  const [gridRangeStartLocal, setGridRangeStartLocal] = useState("");
  const [gridRangeEndLocal, setGridRangeEndLocal] = useState("");
  const [calendarView, setCalendarView] =
    useState<CalendarSchedulerView>("week");
  const [calendarVisibleDateIso, setCalendarVisibleDateIso] = useState(() =>
    new Date().toISOString(),
  );
  const calendarWindow = useMemo(
    () => toCalendarFetchWindow(calendarView, calendarVisibleDateIso),
    [calendarView, calendarVisibleDateIso],
  );
  const [rows, setRows] = useState<TransportService[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<
    TransportCalendarEvent[]
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [selectedServiceFallback, setSelectedServiceFallback] =
    useState<TransportService | null>(null);
  const [openedServiceId, setOpenedServiceId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<{
    message: string;
    severity: "warning" | "error";
  } | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignVehicleId, setAssignVehicleId] = useState("");
  const [assignVehicleLabel, setAssignVehicleLabel] = useState("");
  const [assignVehicleSecondaryLabel, setAssignVehicleSecondaryLabel] =
    useState("");
  const [assignTeamMembers, setAssignTeamMembers] = useState<
    AssignDialogMember[]
  >([]);
  const [assignNote, setAssignNote] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [calendarCreateSeed, setCalendarCreateSeed] = useState<string | null>(
    null,
  );
  const createDialog = useDialogState(false);
  const editDialog = useDialogState(false);
  const deleteDialog = useConfirmActionState();

  const pickDisplayLabel = (
    detailLabel: string | null | undefined,
    entityId: string | null | undefined,
    gridLabel: string | null | undefined,
  ) => {
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
  };

  const normalizeLookupLabel = (
    label: string | null | undefined,
    entityId: string | null | undefined,
  ) => {
    const normalizedLabel = label?.trim() ?? "";
    const normalizedEntityId = entityId?.trim() ?? "";

    if (!normalizedLabel) {
      return "";
    }

    if (normalizedEntityId && normalizedLabel === normalizedEntityId) {
      return "";
    }

    return normalizedLabel;
  };

  const toServiceFallbackFromCalendarEvent = (
    event: TransportCalendarEvent,
  ): TransportService => {
    const volunteers = event.volunteers.map((volunteer) => ({ ...volunteer }));
    const assignedVolunteerIds = volunteers
      .map((volunteer) => volunteer.volunteerId?.trim() ?? "")
      .filter(Boolean);
    const assignedVolunteerNames = volunteers.map(
      (volunteer) => volunteer.fullName?.trim() ?? "",
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
      (fallbackClientName || event.clientId || null);
    const pickupDestinationDisplayName =
      event.pickupDestinationDisplayName ??
      event.pickupDestinationName ??
      (fallbackPickupDestination || event.pickupDestinationId || null);
    const vehicleDisplayName =
      event.vehicleDisplayName ??
      (fallbackVehicleName || event.vehicleId || null);

    return {
      id: event.id,
      organizationId: event.organizationId,
      status: event.status,
      priority: event.priority,
      scheduledAt: event.scheduledAt,
      scheduledEnd: event.scheduledEnd,
      scheduleVersion: event.scheduleVersion,
      clientId: event.clientId || null,
      clientDisplayName,
      pickupDestinationId: event.pickupDestinationId || null,
      pickupDestinationDisplayName,
      dropoffAddress: event.dropoffAddress || null,
      dropoffCity: event.dropoffCity || null,
      dropoffProvince: event.dropoffProvince || null,
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
      teamMemberCount: event.teamMemberCount || volunteers.length,
      acceptedAt: null,
      assignedAt: event.assignedAt,
      startedAt: null,
      completedAt: null,
      cancelledAt: event.cancelledAt,
      createdAt: event.createdAt,
    };
  };

  const selectedTransportService = useMemo(() => {
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
        clientId:
          selectedFromDetail.clientId ?? selectedFromGrid?.clientId ?? null,
        clientDisplayName: pickDisplayLabel(
          selectedFromDetail.clientDisplayName,
          selectedFromDetail.clientId,
          selectedFromGrid?.clientDisplayName,
        ),
        pickupDestinationId:
          selectedFromDetail.pickupDestinationId ??
          selectedFromGrid?.pickupDestinationId ??
          null,
        pickupDestinationDisplayName: pickDisplayLabel(
          selectedFromDetail.pickupDestinationDisplayName,
          selectedFromDetail.pickupDestinationId,
          selectedFromGrid?.pickupDestinationDisplayName,
        ),
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
  }, [rows, selectedServiceFallback, selectedServiceId]);

  const openServiceDetail = (serviceId: string) => {
    setOpenedServiceId(serviceId);
    setSelectedServiceId(serviceId);
    setActionError(null);
  };

  const handleRowClick = (params: GridRowParams<TransportService>) => {
    setSelectedServiceFallback(null);
    setSelectedServiceId(params.row.id);
    setActionError(null);
  };

  const handleCalendarEventSelect = (eventId: string) => {
    setSelectedServiceId(eventId);
    setActionError(null);
  };

  const handleCalendarEventOpenDetail = (eventId: string) => {
    setOpenedServiceId(null);
    setDetailError(null);
    setSelectedServiceId(eventId);
    setActionError(null);

    const selectedFromGrid = rows.find((item) => item.id === eventId);
    if (selectedFromGrid) {
      setSelectedServiceFallback(null);
      openServiceDetail(eventId);
      return;
    }

    const selectedFromCalendar = calendarEvents.find(
      (event) => event.id === eventId,
    );
    if (selectedFromCalendar) {
      setSelectedServiceFallback(
        toServiceFallbackFromCalendarEvent(selectedFromCalendar),
      );
      openServiceDetail(eventId);
      return;
    }

    setSelectedServiceFallback(null);
    openServiceDetail(eventId);
  };

  const handleCalendarEmptySlotCreate = (seedDateIso: string) => {
    setOpenedServiceId(null);
    setDetailError(null);
    setCalendarCreateSeed(seedDateIso);
    createDialog.open();
  };

  const handleShiftCalendarEventByMinutes = async (
    eventId: string,
    minutesDelta: number,
  ) => {
    const event = calendarEvents.find((candidate) => candidate.id === eventId);
    if (!event) {
      return;
    }

    const startMs = new Date(event.scheduledAt).getTime();
    const parsedEndMs = event.scheduledEnd
      ? new Date(event.scheduledEnd).getTime()
      : Number.NaN;
    const durationMs =
      Number.isFinite(startMs) &&
      Number.isFinite(parsedEndMs) &&
      parsedEndMs > startMs
        ? parsedEndMs - startMs
        : 1000 * 60 * 60;
    const shiftedStartMs = startMs + minutesDelta * 60 * 1000;
    const shiftedEndMs = shiftedStartMs + durationMs;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const expectedVersion =
      rows.find((item) => item.id === eventId)?.scheduleVersion ??
      event.scheduleVersion ??
      (selectedTransportService?.id === eventId
        ? selectedTransportService.scheduleVersion
        : undefined);

    await executeServiceAction(
      () =>
        updateTransportServiceSchedule(eventId, {
          scheduledAt: new Date(shiftedStartMs).toISOString(),
          scheduledEnd: new Date(shiftedEndMs).toISOString(),
          timezone,
          expectedVersion,
        }),
      "Spostamento evento non riuscito.",
    );
  };

  const selectedServiceFormValues = useMemo<
    TransportServiceFormData | undefined
  >(() => {
    if (!selectedTransportService) {
      return undefined;
    }

    const serviceVolunteers = selectedTransportService.volunteers;
    const hasServiceVolunteers = serviceVolunteers.length > 0;

    const volunteerIds = hasServiceVolunteers
      ? serviceVolunteers.map((volunteer) => volunteer.volunteerId)
      : selectedTransportService.assignedVolunteerIds.length > 0
        ? selectedTransportService.assignedVolunteerIds
        : [];
    const volunteerLabels = hasServiceVolunteers
      ? serviceVolunteers.map((volunteer) =>
          normalizeLookupLabel(volunteer.fullName, volunteer.volunteerId),
        )
      : volunteerIds.map((volunteerId) => {
          const alignedIndex =
            selectedTransportService.assignedVolunteerIds.findIndex(
              (candidateId) => candidateId === volunteerId,
            );
          const alignedName =
            alignedIndex >= 0
              ? (selectedTransportService.assignedVolunteerNames[
                  alignedIndex
                ]?.trim() ?? "")
              : "";

          return normalizeLookupLabel(alignedName, volunteerId);
        });
    const volunteerRoles = hasServiceVolunteers
      ? serviceVolunteers.map((volunteer) => volunteer.role)
      : volunteerIds.map((_, index) => (index === 0 ? "driver" : "attendant"));

    return {
      clientId: selectedTransportService.clientId ?? "",
      clientLabel: normalizeLookupLabel(
        selectedTransportService.clientDisplayName,
        selectedTransportService.clientId,
      ),
      pickupDestinationId: selectedTransportService.pickupDestinationId ?? "",
      pickupDestinationLabel: normalizeLookupLabel(
        selectedTransportService.pickupDestinationDisplayName,
        selectedTransportService.pickupDestinationId,
      ),
      scheduledAt: selectedTransportService.scheduledAt,
      scheduledEnd: selectedTransportService.scheduledEnd ?? null,
      serviceStatus: selectedTransportService.status,
      dropoffAddress: selectedTransportService.dropoffAddress ?? "",
      dropoffCity: selectedTransportService.dropoffCity ?? "",
      dropoffProvince: selectedTransportService.dropoffProvince ?? "",
      vehicleId: selectedTransportService.vehicleId ?? "",
      vehicleLabel: normalizeLookupLabel(
        selectedTransportService.vehicleDisplayName,
        selectedTransportService.vehicleId,
      ),
      vehicleSecondaryLabel: selectedTransportService.vehicleDescription ?? "",
      volunteerIds,
      volunteerLabels,
      volunteerRoles,
      priority: selectedTransportService.priority,
      isPaid: selectedTransportService.isPaid,
      amount: selectedTransportService.amount,
      note: selectedTransportService.note ?? "",
    };
  }, [selectedTransportService]);

  const calendarCreateInitialValues = useMemo<
    TransportServiceFormData | undefined
  >(() => {
    if (!calendarCreateSeed) {
      return undefined;
    }

    const start = dayjs(calendarCreateSeed);
    const normalizedStart = start.isValid() ? start : dayjs();
    return {
      clientId: "",
      clientLabel: "",
      pickupDestinationId: "",
      pickupDestinationLabel: "",
      scheduledAt: normalizedStart.toISOString(),
      scheduledEnd: normalizedStart.add(1, "hour").toISOString(),
      serviceStatus: "pending",
      dropoffAddress: "",
      dropoffCity: "",
      dropoffProvince: "",
      vehicleId: "",
      vehicleLabel: "",
      vehicleSecondaryLabel: "",
      volunteerIds: [],
      volunteerLabels: [],
      volunteerRoles: [],
      priority: "routine",
      isPaid: false,
      amount: null,
      note: "",
    };
  }, [calendarCreateSeed]);

  useEffect(() => {
    if (!openedServiceId) {
      return;
    }

    let disposed = false;

    const loadOpenedDetail = async () => {
      setIsDetailLoading(true);
      setDetailError(null);

      try {
        const service = await getTransportServiceById(openedServiceId);
        if (!disposed) {
          setSelectedServiceFallback(service);
        }
      } catch (error) {
        if (!disposed) {
          setDetailError(
            getErrorMessage(
              error,
              "Caricamento dettaglio servizio non riuscito.",
            ),
          );
        }
      } finally {
        if (!disposed) {
          setIsDetailLoading(false);
        }
      }
    };

    void loadOpenedDetail();

    return () => {
      disposed = true;
    };
  }, [openedServiceId]);

  useEffect(() => {
    if (!editDialog.isOpen || !selectedServiceId) {
      return;
    }

    let disposed = false;

    const loadDetail = async () => {
      try {
        const service = await getTransportServiceById(selectedServiceId);
        if (!disposed) {
          setSelectedServiceFallback(service);
        }
      } catch {
        // Keep current row snapshot if detail fetch fails.
      }
    };

    void loadDetail();

    return () => {
      disposed = true;
    };
  }, [editDialog.isOpen, selectedServiceId]);

  const handleCreateService = async (values: TransportServiceFormData) => {
    if (!scopedOrganizationId) {
      return;
    }

    let created = await createTransportService({
      organizationId: scopedOrganizationId,
      clientId: values.clientId,
      pickupDestinationId: values.pickupDestinationId,
      scheduledAt: values.scheduledAt,
      scheduledEnd: values.scheduledEnd,
      dropoffAddress: values.dropoffAddress,
      dropoffCity: values.dropoffCity,
      dropoffProvince: values.dropoffProvince,
      priority: values.priority,
      isPaid: values.isPaid,
      amount: values.amount,
      note: values.note || undefined,
    });

    if (values.serviceStatus === "accepted" && created.status === "pending") {
      created = await acceptTransportService(created.id);
    }

    const shouldAssignResources =
      values.vehicleId.trim().length > 0 && values.volunteerIds.length > 0;
    if (shouldAssignResources) {
      if (!session?.userId) {
        throw new Error(
          "Sessione utente non valida per assegnare le risorse del servizio.",
        );
      }

      if (created.status === "pending") {
        created = await acceptTransportService(created.id);
      }

      created = await assignTransportService(created.id, {
        vehicleId: values.vehicleId,
        assignedByUserId: session.userId,
        teamMembers: values.volunteerIds.map((volunteerId, index) => ({
          volunteerId,
          role:
            values.volunteerRoles[index] ??
            (index === 0 ? "driver" : "attendant"),
        })),
        note: values.note || undefined,
        assignedAt: new Date().toISOString(),
      });
    }

    setSelectedServiceId(created.id);
    setSelectedServiceFallback(created);
    setReloadKey((current) => current + 1);
  };

  const handleEditService = async (values: TransportServiceFormData) => {
    if (!selectedTransportService) {
      return;
    }

    let updated = await updateTransportService(selectedTransportService.id, {
      organizationId:
        selectedTransportService.organizationId || scopedOrganizationId || "",
      clientId: values.clientId,
      pickupDestinationId: values.pickupDestinationId,
      scheduledAt: values.scheduledAt,
      scheduledEnd: values.scheduledEnd,
      dropoffAddress: values.dropoffAddress,
      dropoffCity: values.dropoffCity,
      dropoffProvince: values.dropoffProvince,
      priority: values.priority,
      isPaid: values.isPaid,
      amount: values.amount,
      note: values.note || undefined,
    });

    if (values.serviceStatus === "accepted" && updated.status === "pending") {
      updated = await acceptTransportService(updated.id);
    }

    const shouldAssignResources =
      values.vehicleId.trim().length > 0 && values.volunteerIds.length > 0;
    if (shouldAssignResources) {
      if (!session?.userId) {
        throw new Error(
          "Sessione utente non valida per assegnare le risorse del servizio.",
        );
      }

      if (updated.status === "pending") {
        updated = await acceptTransportService(updated.id);
      }

      updated = await assignTransportService(updated.id, {
        vehicleId: values.vehicleId,
        assignedByUserId: session.userId,
        teamMembers: values.volunteerIds.map((volunteerId, index) => ({
          volunteerId,
          role:
            values.volunteerRoles[index] ??
            (index === 0 ? "driver" : "attendant"),
        })),
        note: values.note || undefined,
        assignedAt: new Date().toISOString(),
      });
    }

    setSelectedServiceId(updated.id);
    setSelectedServiceFallback(updated);

    setReloadKey((current) => current + 1);
  };

  const executeServiceAction = async (
    action: () => Promise<TransportService>,
    fallbackMessage: string,
  ): Promise<boolean> => {
    setActionError(null);
    setIsActionSubmitting(true);

    try {
      const updated = await action();
      setSelectedServiceId(updated.id);
      setSelectedServiceFallback(updated);
      setReloadKey((current) => current + 1);
      return true;
    } catch (error) {
      const uiError = toApiUiError(error, fallbackMessage);
      const conflictMessage = toConflictMessage(error);
      const userMessage = conflictMessage ?? uiError.userMessage;
      setActionError(userMessage);
      setActionToast({
        message: userMessage,
        severity:
          uiError.isBadRequest || uiError.isConflict ? "warning" : "error",
      });
      return false;
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleAcceptService = async () => {
    if (!selectedTransportService) {
      return;
    }

    await executeServiceAction(
      () => acceptTransportService(selectedTransportService.id),
      "Cambio stato in accettato non riuscito.",
    );
  };

  const handleStartService = async () => {
    if (!selectedTransportService) {
      return;
    }

    await executeServiceAction(
      () => startTransportService(selectedTransportService.id),
      "Avvio servizio non riuscito.",
    );
  };

  const handleCompleteService = async () => {
    if (!selectedTransportService) {
      return;
    }

    await executeServiceAction(
      () => completeTransportService(selectedTransportService.id),
      "Completamento servizio non riuscito.",
    );
  };

  const handleCancelService = async () => {
    if (!selectedTransportService) {
      return;
    }

    setIsCancelDialogOpen(false);
    await executeServiceAction(
      () => cancelTransportService(selectedTransportService.id),
      "Annullamento servizio non riuscito.",
    );
  };

  const handleOpenAssignDialog = () => {
    if (!selectedTransportService) {
      return;
    }

    setAssignVehicleId(selectedTransportService.vehicleId ?? "");
    setAssignVehicleLabel(selectedTransportService.vehicleDisplayName ?? "");
    setAssignVehicleSecondaryLabel(
      selectedTransportService.vehicleDescription ?? "",
    );
    if (selectedTransportService.volunteers.length > 0) {
      setAssignTeamMembers(
        selectedTransportService.volunteers.map((volunteer) => ({
          volunteerId: volunteer.volunteerId,
          label: volunteer.fullName.trim(),
          role: volunteer.role,
        })),
      );
    } else {
      setAssignTeamMembers(
        selectedTransportService.assignedVolunteerIds.map(
          (volunteerId, index) => {
            const alignedName =
              selectedTransportService.assignedVolunteerNames[index]?.trim() ??
              "";

            return {
              volunteerId,
              label: alignedName,
              role: index === 0 ? "driver" : "attendant",
            };
          },
        ),
      );
    }
    setAssignNote(selectedTransportService.note ?? "");
    setAssignError(null);
    setIsAssignDialogOpen(true);
  };

  const handleAssignResources = async () => {
    if (!selectedTransportService || !session?.userId) {
      return;
    }

    if (!assignVehicleId.trim()) {
      setAssignError("Seleziona un veicolo.");
      return;
    }

    if (assignTeamMembers.length === 0) {
      setAssignError("Seleziona almeno un volontario.");
      return;
    }

    setAssignError(null);

    const didAssign = await executeServiceAction(
      () =>
        assignTransportService(selectedTransportService.id, {
          vehicleId: assignVehicleId,
          assignedByUserId: session.userId,
          teamMembers: assignTeamMembers.map((member) => ({
            volunteerId: member.volunteerId,
            role: member.role,
          })),
          note: assignNote || undefined,
          assignedAt: new Date().toISOString(),
        }),
      "Assegnazione risorse non riuscita.",
    );

    if (didAssign) {
      setIsAssignDialogOpen(false);
    }
  };

  const handleOpenRescheduleDialog = () => {
    if (!selectedTransportService) {
      return;
    }

    setRescheduleAt(selectedTransportService.scheduledAt ?? "");
    setRescheduleError(null);
    setIsRescheduleDialogOpen(true);
  };

  const handleRescheduleService = async () => {
    if (!selectedTransportService) {
      return;
    }

    if (!rescheduleAt) {
      setRescheduleError("Seleziona una data valida.");
      return;
    }

    setRescheduleError(null);

    const parsedStart = new Date(rescheduleAt).getTime();
    const currentStart = new Date(
      selectedTransportService.scheduledAt,
    ).getTime();
    const currentEnd = selectedTransportService.scheduledEnd
      ? new Date(selectedTransportService.scheduledEnd).getTime()
      : Number.NaN;
    const durationMs =
      Number.isFinite(currentStart) &&
      Number.isFinite(currentEnd) &&
      currentEnd > currentStart
        ? currentEnd - currentStart
        : 1000 * 60 * 60;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    const didReschedule = await executeServiceAction(
      () =>
        updateTransportServiceSchedule(selectedTransportService.id, {
          scheduledAt: new Date(parsedStart).toISOString(),
          scheduledEnd: new Date(parsedStart + durationMs).toISOString(),
          timezone,
          expectedVersion:
            selectedTransportService.scheduleVersion > 0
              ? selectedTransportService.scheduleVersion
              : undefined,
        }),
      "Ripianificazione non riuscita.",
    );

    if (didReschedule) {
      setIsRescheduleDialogOpen(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedTransportService) {
      return;
    }

    await deleteDialog.run(async () => {
      await deleteTransportService(selectedTransportService.id);
      setSelectedServiceId(null);
      setSelectedServiceFallback(null);
      setReloadKey((current) => current + 1);
    }, "Eliminazione servizio non riuscita.");
  };

  const handleStatusFilterChange = (value: TransportStatusFilter) => {
    setStatusFilter(value);
    handlePaginationModelChange({ ...paginationModel, page: 0 });
  };

  const handlePriorityFilterChange = (value: TransportPriorityFilter) => {
    setPriorityFilter(value);
    handlePaginationModelChange({ ...paginationModel, page: 0 });
  };

  const handleVolunteerFilterChange = (
    ids: string[],
    options: LookupOption[],
  ) => {
    setVolunteerFilterIds(ids);
    setVolunteerFilterLabels(options.map((option) => option.label));
    handlePaginationModelChange({ ...paginationModel, page: 0 });
  };

  const handleGridRangeStartChange = (nextValue: string) => {
    setGridRangeStartLocal(nextValue);
    handlePaginationModelChange({ ...paginationModel, page: 0 });
  };

  const handleGridRangeEndChange = (nextValue: string) => {
    setGridRangeEndLocal(nextValue);
    handlePaginationModelChange({ ...paginationModel, page: 0 });
  };

  const handleCalendarViewChange = (view: CalendarSchedulerView) => {
    setCalendarView(view);
  };

  useEffect(() => {
    if (activeView === "calendar") {
      setOpenedServiceId(null);
      setDetailError(null);
    }
  }, [activeView]);

  const handleCalendarVisibleDateChange = (nextVisibleDateIso: string) => {
    const parsedNext = dayjs(nextVisibleDateIso);
    if (!parsedNext.isValid()) {
      return;
    }

    const normalizedNext = parsedNext.toISOString();
    setCalendarVisibleDateIso((current) =>
      current === normalizedNext ? current : normalizedNext,
    );
  };

  useEffect(() => {
    if (!session || !scopedOrganizationId) {
      return;
    }

    let isDisposed = false;

    const loadWorkspaceData = async () => {
      setIsLoading(true);
      setListError(null);
      setCalendarError(null);

      try {
        const sort = sortModel[0];
        const onlyOpen = statusFilter === "OPEN" ? true : undefined;
        const selectedStatus =
          statusFilter === "OPEN" ? undefined : statusFilter;
        const selectedPriority =
          priorityFilter === "all" ? undefined : priorityFilter;
        const rangeStartUtc = toUtcIsoOrUndefined(gridRangeStartLocal);
        const rangeEndUtc = toUtcIsoOrUndefined(gridRangeEndLocal);

        const servicePage = await searchTransportServices({
          pageIndex: paginationModel.page,
          pageSize: paginationModel.pageSize,
          searchText: debouncedSearchText || undefined,
          sortBy: sort?.field,
          sortDescending: sort?.sort === "desc",
          organizationId: scopedOrganizationId,
          status: selectedStatus,
          priority: selectedPriority,
          onlyOpen,
          rangeStartUtc,
          rangeEndUtc,
          volunteerIds:
            volunteerFilterIds.length > 0 ? volunteerFilterIds : undefined,
        });

        if (!isDisposed) {
          setRows(servicePage.items);
          setTotalCount(servicePage.totalCount);
        }

        try {
          const events = await getTransportCalendarEvents({
            organizationId: scopedOrganizationId,
            startUtc: calendarWindow.startUtc,
            endUtc: calendarWindow.endUtc,
          });

          if (!isDisposed) {
            setCalendarEvents(events);
            setCalendarError(null);
          }
        } catch (calendarLoadError) {
          if (!isDisposed) {
            setCalendarEvents([]);
            setCalendarError(
              getErrorMessage(
                calendarLoadError,
                "Caricamento calendario non riuscito.",
              ),
            );
          }
        }
      } catch (error) {
        if (!isDisposed) {
          setListError(
            getErrorMessage(
              error,
              "Caricamento servizi trasporto non riuscito.",
            ),
          );
          setRows([]);
          setTotalCount(0);
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    void loadWorkspaceData();

    return () => {
      isDisposed = true;
    };
  }, [
    debouncedSearchText,
    paginationModel.page,
    paginationModel.pageSize,
    priorityFilter,
    reloadKey,
    scopedOrganizationId,
    session,
    statusFilter,
    sortModel,
    volunteerFilterIds,
    gridRangeStartLocal,
    gridRangeEndLocal,
    calendarWindow.startUtc,
    calendarWindow.endUtc,
  ]);

  if (!session) {
    return <LoadingState message="Inizializzazione workspace Trasporti..." />;
  }

  const searchClientLookup = async (
    input: LookupSearchInput,
    organizationId: string,
  ): Promise<LookupSearchResult> => {
    const response = await searchClients({
      pageIndex: input.pageIndex,
      pageSize: input.pageSize,
      searchText: input.query || undefined,
      organizationId,
    });

    return {
      items: response.items.map(
        (item): LookupOption => ({
          id: item.id,
          label:
            item.fullName ||
            `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
            item.id,
          description: [item.address, item.city, item.province]
            .filter(Boolean)
            .join(", "),
          data: {
            address: item.address,
            city: item.city,
            province: item.province,
          },
        }),
      ),
      hasNextPage: response.hasNextPage,
    };
  };

  const searchDestinationLookup = async (
    input: LookupSearchInput,
    organizationId: string,
  ): Promise<LookupSearchResult> => {
    const response = await searchDestinations({
      pageIndex: input.pageIndex,
      pageSize: input.pageSize,
      searchText: input.query || undefined,
      organizationId,
    });

    return {
      items: response.items.map(
        (item): LookupOption => ({
          id: item.id,
          label: item.name,
          description:
            [item.city, item.province].filter(Boolean).join(" ") || undefined,
        }),
      ),
      hasNextPage: response.hasNextPage,
    };
  };

  const searchVehicleLookup = async (
    input: LookupSearchInput,
    organizationId: string,
  ): Promise<LookupSearchResult> => {
    const response = await searchVehicles({
      pageIndex: input.pageIndex,
      pageSize: input.pageSize,
      searchText: input.query || undefined,
      organizationId,
    });

    return {
      items: response.items.map(
        (item): LookupOption => ({
          id: item.id,
          label: item.description || item.plateNumber || item.id,
          description: [item.plateNumber, toVehicleTypeLabel(item.type)]
            .filter(Boolean)
            .join(" · "),
        }),
      ),
      hasNextPage: response.hasNextPage,
    };
  };

  const searchVolunteerLookup = async (
    input: LookupSearchInput,
    organizationId: string,
  ): Promise<LookupSearchResult> => {
    const response = await searchVolunteers({
      pageIndex: input.pageIndex,
      pageSize: input.pageSize,
      searchText: input.query || undefined,
      organizationId,
      isActive: true,
    });

    return {
      items: response.items.map(
        (item): LookupOption => ({
          id: item.id,
          label: item.fullName,
          description: item.phone || undefined,
        }),
      ),
      hasNextPage: response.hasNextPage,
    };
  };

  const canAccept = selectedTransportService?.status === "pending";
  const canStart = selectedTransportService?.status === "assigned";
  const canComplete = selectedTransportService?.status === "in_progress";
  const canCancel =
    selectedTransportService?.status !== "completed" &&
    selectedTransportService?.status !== "cancelled";
  const canAssign =
    selectedTransportService?.status !== "completed" &&
    selectedTransportService?.status !== "cancelled";
  const canReschedule = canCancel;

  if (!scopedOrganizationId) {
    return (
      <ErrorState
        title="Contesto organizzazione non disponibile."
        description="Seleziona un'organizzazione per usare la workspace trasporti."
      />
    );
  }

  return (
    <Stack spacing={4}>
      <ContentCard className="backdrop-blur-none p-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Box sx={workspaceHeaderIconSx}>
              <LocalShipping sx={{ fontSize: 24 }} />
            </Box>
            <Typography variant="sectionEyebrow" sx={{ fontSize: 16 }}>
              Trasporto socio-sanitario
            </Typography>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeView !== "calendar" ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  sx={workspacePrimaryActionButtonSx}
                  onClick={() => {
                    setCalendarCreateSeed(null);
                    createDialog.open();
                  }}
                >
                  Nuovo
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  sx={workspacePrimaryActionButtonSx}
                  disabled={!selectedTransportService}
                  onClick={editDialog.open}
                >
                  Modifica
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteOutline />}
                  disabled={!selectedTransportService}
                  onClick={deleteDialog.open}
                >
                  Elimina
                </Button>
              </>
            ) : null}

            <ToggleButtonGroup
              size="small"
              exclusive
              value={activeView}
              onChange={(_, value: WorkspaceView | null) => {
                if (!value || value === activeView) {
                  return;
                }
                setActiveView(value);
              }}
              sx={workspaceViewToggleGroupSx}
            >
              <ToggleButton value="grid">
                <ViewList sx={{ fontSize: 18, mr: 0.75 }} /> Lista
              </ToggleButton>
              <ToggleButton value="calendar">
                <CalendarMonth sx={{ fontSize: 18, mr: 0.75 }} /> Calendario
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>
      </ContentCard>

      <ContentCard className="backdrop-blur-none">
        <Stack spacing={3}>
          {activeView === "grid" ? (
            <ContentCard>
              <Stack spacing={2.25}>
                <Typography variant="sectionEyebrow">
                  Ricerca servizi
                </Typography>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.25}
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <TextField
                    fullWidth
                    label="Cerca"
                    placeholder="Cerca per cliente, stato, priorita o destinazione"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                  />
                  <TextField
                    select
                    fullWidth
                    label="Stato servizio"
                    value={statusFilter}
                    onChange={(event) =>
                      handleStatusFilterChange(
                        event.target.value as TransportStatusFilter,
                      )
                    }
                  >
                    {statusFilterOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    label="Tipologia"
                    value={priorityFilter}
                    onChange={(event) =>
                      handlePriorityFilterChange(
                        event.target.value as TransportPriorityFilter,
                      )
                    }
                  >
                    {priorityFilterOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Tooltip
                    title={
                      isGridAdvancedFiltersOpen
                        ? "Nascondi filtri avanzati"
                        : "Mostra filtri avanzati"
                    }
                  >
                    <IconButton
                      type="button"
                      aria-label={
                        isGridAdvancedFiltersOpen
                          ? "Nascondi filtri avanzati"
                          : "Mostra filtri avanzati"
                      }
                      onClick={() =>
                        setIsGridAdvancedFiltersOpen((current) => !current)
                      }
                      sx={{
                        width: 40,
                        height: 40,
                        alignSelf: "center",
                        borderRadius: 2,
                        border: "1px solid rgba(15, 109, 122, 0.35)",
                        color: "var(--accent-secondary)",
                        backgroundColor: isGridAdvancedFiltersOpen
                          ? "rgba(15, 109, 122, 0.16)"
                          : "#ffffff",
                        "&:hover": {
                          backgroundColor: "rgba(15, 109, 122, 0.12)",
                        },
                      }}
                    >
                      {isGridAdvancedFiltersOpen ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )}
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Collapse in={isGridAdvancedFiltersOpen}>
                  <Stack
                    spacing={1.25}
                    sx={{ pt: 0.5 }}
                    direction={{ xs: "column", md: "row" }}
                  >
                    <Box sx={{ width: "100%" }}>
                      <EntityLookupDialogField
                        label="Filtra per volontari"
                        dialogTitle="Seleziona volontari"
                        value={volunteerFilterIds}
                        selectedOptions={volunteerFilterIds.map(
                          (id, index) => ({
                            id,
                            label: volunteerFilterLabels[index],
                          }),
                        )}
                        multiple
                        triggerAriaLabel="Apri filtro volontari"
                        disabled={!scopedOrganizationId}
                        onSearch={(input) =>
                          scopedOrganizationId
                            ? searchVolunteerLookup(input, scopedOrganizationId)
                            : Promise.resolve({ items: [], hasNextPage: false })
                        }
                        onChange={handleVolunteerFilterChange}
                      />
                    </Box>

                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Periodo da"
                      InputLabelProps={{ shrink: true }}
                      value={gridRangeStartLocal}
                      onChange={(event) =>
                        handleGridRangeStartChange(event.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Periodo a"
                      InputLabelProps={{ shrink: true }}
                      value={gridRangeEndLocal}
                      onChange={(event) =>
                        handleGridRangeEndChange(event.target.value)
                      }
                    />
                  </Stack>
                </Collapse>
              </Stack>
            </ContentCard>
          ) : null}

          {listError ? (
            <ErrorState
              title="Ricerca trasporti non riuscita."
              description={listError}
              onRetry={() =>
                handlePaginationModelChange({ ...paginationModel })
              }
            />
          ) : activeView === "grid" ? (
            <TransportServicesGrid
              rows={rows}
              isLoading={isLoading}
              totalCount={totalCount}
              paginationModel={paginationModel}
              sortModel={sortModel}
              selectedId={selectedServiceId}
              onPaginationModelChange={handlePaginationModelChange}
              onSortModelChange={handleSortModelChange}
              onRowClick={handleRowClick}
              onOpenDetail={openServiceDetail}
            />
          ) : (
            <TransportServicesCalendar
              events={calendarEvents}
              errorMessage={calendarError}
              selectedEventId={selectedServiceId}
              view={calendarView}
              visibleDateIso={calendarVisibleDateIso}
              onViewChange={handleCalendarViewChange}
              onVisibleDateChange={handleCalendarVisibleDateChange}
              onSelectEvent={handleCalendarEventSelect}
              onOpenEventDetail={handleCalendarEventOpenDetail}
              onCreateSlot={handleCalendarEmptySlotCreate}
              onShiftEvent={(eventId, minutesDelta) => {
                void handleShiftCalendarEventByMinutes(eventId, minutesDelta);
              }}
            />
          )}

          {calendarError && activeView === "grid" ? (
            <Alert severity="warning">{calendarError}</Alert>
          ) : null}
        </Stack>
      </ContentCard>

      <TransportServiceDetailPanel
        open={Boolean(openedServiceId)}
        service={selectedTransportService}
        isLoading={isDetailLoading}
        isActionSubmitting={isActionSubmitting}
        errorMessage={detailError}
        actionErrorMessage={actionError}
        onAccept={() => {
          void handleAcceptService();
        }}
        onAssign={handleOpenAssignDialog}
        onStart={() => {
          void handleStartService();
        }}
        onComplete={() => {
          void handleCompleteService();
        }}
        onReschedule={handleOpenRescheduleDialog}
        onEdit={editDialog.open}
        onDelete={deleteDialog.open}
        onCancelService={() => setIsCancelDialogOpen(true)}
        canAccept={Boolean(canAccept)}
        canAssign={Boolean(canAssign)}
        canStart={Boolean(canStart)}
        canComplete={Boolean(canComplete)}
        canReschedule={Boolean(canReschedule)}
        canCancel={Boolean(canCancel)}
        onClose={() => {
          setOpenedServiceId(null);
          setDetailError(null);
        }}
      />

      <TransportServiceFormDialog
        open={createDialog.isOpen}
        mode="create"
        initialValues={calendarCreateInitialValues}
        organizationId={scopedOrganizationId}
        onSearchClients={searchClientLookup}
        onSearchDestinations={searchDestinationLookup}
        onSearchVehicles={searchVehicleLookup}
        onSearchVolunteers={searchVolunteerLookup}
        onClose={() => {
          setCalendarCreateSeed(null);
          createDialog.close();
        }}
        onSubmit={handleCreateService}
      />

      <TransportServiceFormDialog
        open={editDialog.isOpen}
        mode="edit"
        initialValues={selectedServiceFormValues}
        organizationId={scopedOrganizationId}
        onSearchClients={searchClientLookup}
        onSearchDestinations={searchDestinationLookup}
        onSearchVehicles={searchVehicleLookup}
        onSearchVolunteers={searchVolunteerLookup}
        onClose={editDialog.close}
        onSubmit={handleEditService}
      />

      <Dialog
        open={isAssignDialogOpen}
        onClose={
          isActionSubmitting ? undefined : () => setIsAssignDialogOpen(false)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pb: 1.25 }}>
          <FeatureDialogTitle
            icon={<GroupAdd sx={{ fontSize: 20 }} />}
            eyebrow="Assegna risorse"
          />
        </DialogTitle>
        <DialogContent sx={formDialogContentSx}>
          <Stack spacing={2.5} sx={{ pt: 1.5 }}>
            {assignError ? <Alert severity="error">{assignError}</Alert> : null}

            <EntityLookupDialogField
              label="Veicolo"
              dialogTitle="Seleziona veicolo"
              value={assignVehicleId ? [assignVehicleId] : []}
              selectedOptions={
                assignVehicleId
                  ? [
                      {
                        id: assignVehicleId,
                        label: assignVehicleLabel || assignVehicleId,
                        description: assignVehicleSecondaryLabel || undefined,
                      },
                    ]
                  : []
              }
              required
              disabled={isActionSubmitting || !scopedOrganizationId}
              triggerAriaLabel="Apri ricerca veicolo"
              onSearch={(input) =>
                scopedOrganizationId
                  ? searchVehicleLookup(input, scopedOrganizationId)
                  : Promise.resolve({ items: [], hasNextPage: false })
              }
              onChange={(ids, options) => {
                setAssignVehicleId(ids[0] ?? "");
                setAssignVehicleLabel(options[0]?.label ?? "");
                setAssignVehicleSecondaryLabel(options[0]?.description ?? "");
              }}
            />

            <EntityLookupDialogField
              label="Volontari"
              dialogTitle="Seleziona volontari"
              value={assignTeamMembers.map((member) => member.volunteerId)}
              selectedOptions={assignTeamMembers.map((member) => ({
                id: member.volunteerId,
                label: member.label,
              }))}
              multiple
              required
              disabled={isActionSubmitting || !scopedOrganizationId}
              triggerAriaLabel="Apri ricerca volontari"
              onSearch={(input) =>
                scopedOrganizationId
                  ? searchVolunteerLookup(input, scopedOrganizationId)
                  : Promise.resolve({ items: [], hasNextPage: false })
              }
              onChange={(ids, options) => {
                setAssignTeamMembers((current) =>
                  ids.map((id, index) => {
                    const existing = current.find(
                      (member) => member.volunteerId === id,
                    );
                    const option = options.find((item) => item.id === id);

                    return {
                      volunteerId: id,
                      label: option?.label ?? existing?.label ?? "",
                      role:
                        existing?.role ??
                        (index === 0 ? "driver" : "attendant"),
                    };
                  }),
                );
              }}
            />

            <Stack spacing={1}>
              <Typography variant="sectionEyebrow">
                Ruolo per volontario
              </Typography>
              {assignTeamMembers.length ? (
                assignTeamMembers.map((member) => (
                  <Stack
                    key={member.volunteerId}
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.25}
                  >
                    <TextField
                      label="Volontario"
                      value={member.label}
                      disabled
                      fullWidth
                    />
                    <TextField
                      select
                      label="Ruolo"
                      value={member.role}
                      onChange={(event) => {
                        const nextRole = event.target
                          .value as TransportAssignmentRole;
                        setAssignTeamMembers((current) =>
                          current.map((currentMember) =>
                            currentMember.volunteerId === member.volunteerId
                              ? { ...currentMember, role: nextRole }
                              : currentMember,
                          ),
                        );
                      }}
                      fullWidth
                    >
                      <MenuItem value="driver">Autista</MenuItem>
                      <MenuItem value="attendant">Accompagnatore</MenuItem>
                    </TextField>
                  </Stack>
                ))
              ) : (
                <Typography variant="bodySmall" color="text.secondary">
                  Seleziona almeno un volontario da assegnare.
                </Typography>
              )}
            </Stack>

            <TextField
              label="Note assegnazione"
              value={assignNote}
              onChange={(event) => setAssignNote(event.target.value)}
              multiline
              minRows={2}
              disabled={isActionSubmitting}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={formDialogActionsEndSx}>
          <Button
            variant="outlined"
            color="error"
            disabled={isActionSubmitting}
            onClick={() => setIsAssignDialogOpen(false)}
          >
            Annulla
          </Button>
          <Button
            variant="contained"
            sx={formDialogPrimaryActionSx}
            disabled={isActionSubmitting}
            onClick={() => {
              void handleAssignResources();
            }}
          >
            {isActionSubmitting ? "Assegnazione..." : "Conferma assegnazione"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isRescheduleDialogOpen}
        onClose={
          isActionSubmitting
            ? undefined
            : () => setIsRescheduleDialogOpen(false)
        }
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 1.25 }}>
          <FeatureDialogTitle
            icon={<EventRepeat sx={{ fontSize: 20 }} />}
            eyebrow="Ripianifica servizio"
          />
        </DialogTitle>
        <DialogContent sx={formDialogContentSx}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2.5} sx={{ pt: 1.5 }}>
              {rescheduleError ? (
                <Alert severity="error">{rescheduleError}</Alert>
              ) : null}

              <DateTimePicker
                label="Nuova data e ora"
                value={rescheduleAt ? dayjs(rescheduleAt) : null}
                onChange={(value) =>
                  setRescheduleAt(
                    value && value.isValid()
                      ? value.toDate().toISOString()
                      : "",
                  )
                }
                ampm={false}
                slotProps={{
                  textField: {
                    required: true,
                    disabled: isActionSubmitting,
                  },
                }}
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={formDialogActionsEndSx}>
          <Button
            variant="outlined"
            color="error"
            disabled={isActionSubmitting}
            onClick={() => setIsRescheduleDialogOpen(false)}
          >
            Annulla
          </Button>
          <Button
            variant="contained"
            sx={formDialogPrimaryActionSx}
            disabled={isActionSubmitting}
            onClick={() => {
              void handleRescheduleService();
            }}
          >
            {isActionSubmitting ? "Salvataggio..." : "Conferma"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmActionDialog
        open={isCancelDialogOpen}
        title="Annullare il servizio selezionato?"
        description="Lo stato del servizio passera ad annullato. L'operazione e tracciata e non distruttiva."
        confirmLabel="Conferma annullamento"
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancelService}
        isConfirming={isActionSubmitting}
        errorMessage={actionError}
      />

      <ConfirmActionDialog
        open={deleteDialog.isOpen}
        title="Eliminare il servizio selezionato?"
        description="L'operazione elimina definitivamente il servizio di trasporto selezionato."
        confirmLabel="Conferma eliminazione"
        onClose={deleteDialog.close}
        onConfirm={handleDeleteService}
        isConfirming={deleteDialog.isSubmitting}
        errorMessage={deleteDialog.errorMessage}
      />

      <Snackbar
        open={Boolean(actionToast)}
        autoHideDuration={4500}
        onClose={() => setActionToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={actionToast?.severity ?? "error"}
          variant="filled"
          onClose={() => setActionToast(null)}
          sx={{ width: "100%" }}
        >
          {actionToast?.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
