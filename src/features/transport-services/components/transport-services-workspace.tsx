"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Add,
  CalendarMonth,
  DeleteOutline,
  Edit,
  ExpandLess,
  ExpandMore,
  FileDownload,
  LocalShipping,
  ViewList,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Collapse,
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
import type { GridRowParams } from "@mui/x-data-grid";
import { ApiError, getErrorMessage } from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import { getEffectiveRoleFromSession } from "@/core/auth/roles";
import {
  deleteTransportService,
  getTransportServiceById,
  getTransportCalendarEvents,
  searchTransportServices,
} from "@/features/transport-services/api/transport-services-api";
import {
  createTransportSheet,
  deleteTransportSheet,
  getTransportSheetByTransportServiceId,
  initializeTransportSheetByTransportServiceId,
  updateTransportSheet,
} from "@/features/transport-services/api/transport-sheets-api";
import { searchClients } from "@/features/clients/api/clients-api";
import { searchDestinations } from "@/features/destinations/api/destinations-api";
import { searchVehicles } from "@/features/vehicles/api/vehicles-api";
import { toVehicleTypeLabel } from "@/features/vehicles/api/types";
import { searchVolunteers } from "@/features/volunteers/api/volunteers-api";
import type {
  TransportCalendarEvent,
  TransportServiceFormData,
  TransportService,
  TransportServiceStatus,
} from "@/features/transport-services/api/types";
import type {
  TransportSheet,
  TransportSheetFormData,
} from "@/features/transport-services/api/transport-sheets-types";
import type {
  LookupOption,
  LookupSearchInput,
  LookupSearchResult,
} from "@/shared/ui/entity-lookup-dialog-field";
import { EntityLookupDialogField } from "@/shared/ui/entity-lookup-dialog-field";
import { TransportServiceFormDialog } from "@/features/transport-services/components/transport-service-form-dialog";
import { TransportServicesCalendar } from "@/features/transport-services/components/transport-services-calendar";
import {
  TransportServicesGrid,
  transportServicesExportColumns,
} from "@/features/transport-services/components/transport-services-grid";
import { useExcelExport } from "@/shared/hooks/use-excel-export";
import { useServerGridState } from "@/shared/hooks/use-server-grid-state";
import { useDialogState } from "@/shared/hooks/use-dialog-confirm-state";
import { ContentCard } from "@/shared/ui/content-card";
import { ErrorState, LoadingState } from "@/shared/ui/feedback-states";
import {
  workspaceCompactPrimaryActionButtonSx,
  workspaceHeaderIconSx,
  workspacePrimaryActionButtonSx,
  workspaceViewToggleGroupSx,
} from "@/shared/ui/workspace-styles";
import {
  type AssignDialogMember,
  mergeSelectedTransportService,
  normalizeLookupLabel,
  sanitizeTransportSortField,
  toCalendarFetchWindow,
  toServiceFallbackFromCalendarEvent,
  toUtcIsoOrUndefined,
} from "./transport-services-workspace-helpers";
import { useTransportServiceMutations } from "./use-transport-service-mutations";
import { TransportServiceDetailPanel } from "./transport-service-detail-panel";
import { TransportSheetFormDialog } from "./transport-sheet-form-dialog";
import { AssignVolunteersDialog } from "./assign-volunteers-dialog";
import { AssignVehicleDialog } from "./assign-vehicle-dialog";
import { RescheduleServiceDialog } from "./reschedule-service-dialog";
import { DeleteTransportSheetDialog } from "./delete-transport-sheet-dialog";
import { CancelTransportServiceDialog } from "./cancel-transport-service-dialog";
import { DeleteTransportServiceDialog } from "./delete-transport-service-dialog";

type WorkspaceView = "grid" | "calendar";
type TransportStatusFilter = "OPEN" | TransportServiceStatus;
type CalendarSchedulerView = "day" | "week" | "month" | "agenda";

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

function toTransportSheetFormData(
  sheet: TransportSheet,
): TransportSheetFormData {
  return {
    sheetNumber: sheet.sheetNumber ?? undefined,
    organizationId: sheet.organizationId,
    reportDate: sheet.reportDate,
    destinationName: sheet.destinationName,
    destinationAddress: sheet.destinationAddress,
    destinationCity: sheet.destinationCity,
    destinationProvince: sheet.destinationProvince,
    destinationNotes: sheet.destinationNotes,
    clientFiscalCode: sheet.clientFiscalCode,
    clientFirstName: sheet.clientFirstName,
    clientLastName: sheet.clientLastName,
    clientPhone: sheet.clientPhone,
    clientAddress: sheet.clientAddress,
    clientCity: sheet.clientCity,
    clientProvince: sheet.clientProvince,
    clientAslNumber: sheet.clientAslNumber,
    clientAslMunicipality: sheet.clientAslMunicipality,
    clientNotes: sheet.clientNotes,
    vehiclePlate: sheet.vehiclePlate,
    startTime: sheet.startTime ?? "",
    endTime: sheet.endTime ?? "",
    kmDeparture:
      typeof sheet.kmDeparture === "number" ? String(sheet.kmDeparture) : "",
    kmArrival:
      typeof sheet.kmArrival === "number" ? String(sheet.kmArrival) : "",
    notes: sheet.notes,
    volunteerIds: sheet.volunteerIds,
    volunteerDisplayNames: [],
  };
}

export function TransportServicesWorkspace() {
  const { exportRowsToExcel } = useExcelExport();
  const { session } = useAuth();
  const effectiveRole = getEffectiveRoleFromSession(session);
  const isVolunteer = effectiveRole === "VOLUNTEER";
  const canManageServiceCrud = !isVolunteer;
  const canUseLifecycleActions = !isVolunteer;
  const canOverrideAssignments =
    effectiveRole === "ORG_ADMIN" || effectiveRole === "SUPER_USER";
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
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignDialogInitialTeamMembers, setAssignDialogInitialTeamMembers] =
    useState<AssignDialogMember[]>([]);
  const [assignDialogInitialNote, setAssignDialogInitialNote] = useState("");
  const [isVolunteerVehicleDialogOpen, setIsVolunteerVehicleDialogOpen] =
    useState(false);
  const [vehicleDialogInitialId, setVehicleDialogInitialId] = useState("");
  const [vehicleDialogInitialLabel, setVehicleDialogInitialLabel] =
    useState("");
  const [vehicleDialogInitialDescription, setVehicleDialogInitialDescription] =
    useState("");
  const [vehicleDialogInitialNote, setVehicleDialogInitialNote] = useState("");
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [rescheduleDialogInitialAt, setRescheduleDialogInitialAt] =
    useState("");
  const [rescheduleDialogInitialEndAt, setRescheduleDialogInitialEndAt] =
    useState("");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDeleteServiceDialogOpen, setIsDeleteServiceDialogOpen] =
    useState(false);
  const [isDeleteServiceSubmitting, setIsDeleteServiceSubmitting] =
    useState(false);
  const [deleteServiceError, setDeleteServiceError] = useState<string | null>(
    null,
  );
  const [isTransportSheetDialogOpen, setIsTransportSheetDialogOpen] =
    useState(false);
  const [transportSheetId, setTransportSheetId] = useState<string | null>(null);
  const [
    isDeleteTransportSheetDialogOpen,
    setIsDeleteTransportSheetDialogOpen,
  ] = useState(false);
  const [isDeletingTransportSheet, setIsDeletingTransportSheet] =
    useState(false);
  const [transportSheetFormValues, setTransportSheetFormValues] = useState<
    TransportSheetFormData | undefined
  >(undefined);
  const [transportSheetError, setTransportSheetError] = useState<string | null>(
    null,
  );
  const [isTransportSheetSubmitting, setIsTransportSheetSubmitting] =
    useState(false);
  const [detailTransportSheet, setDetailTransportSheet] =
    useState<TransportSheet | null>(null);
  const [isDetailTransportSheetLoading, setIsDetailTransportSheetLoading] =
    useState(false);
  const [calendarCreateSeed, setCalendarCreateSeed] = useState<string | null>(
    null,
  );
  const createDialog = useDialogState(false);
  const editDialog = useDialogState(false);

  const {
    actionError,
    actionToast,
    isActionSubmitting,
    setActionError,
    setActionToast,
    createService,
    editService,
    assignResources,
    assignVehicle,
    shiftCalendarEvent,
    rescheduleService,
    acceptService,
    startService,
    cancelService,
    volunteerSelfAssign,
    volunteerSelfRemove,
    volunteerAssignVehicle,
    volunteerRemoveVehicle,
    overrideRemoveVolunteer,
    overrideRemoveVehicle,
  } = useTransportServiceMutations({
    sessionUserId: session?.userId,
    scopedOrganizationId,
    setSelectedServiceId,
    setSelectedServiceFallback,
    setReloadKey,
  });

  const selectedTransportService = useMemo(() => {
    return mergeSelectedTransportService({
      rows,
      selectedServiceFallback,
      selectedServiceId,
    });
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
    if (!canManageServiceCrud) {
      setActionToast({
        message:
          "Con il profilo volontario non puoi creare nuovi servizi da calendario.",
        severity: "warning",
      });
      return;
    }

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

    const expectedVersion =
      rows.find((item) => item.id === eventId)?.scheduleVersion ??
      event.scheduleVersion ??
      (selectedTransportService?.id === eventId
        ? selectedTransportService.scheduleVersion
        : undefined);

    await shiftCalendarEvent(
      eventId,
      event.scheduledAt,
      event.scheduledEnd,
      minutesDelta,
      expectedVersion,
    );
  };

  const selectedServiceFormValues = useMemo<
    TransportServiceFormData | undefined
  >(() => {
    if (!selectedTransportService) {
      return undefined;
    }

    const serviceVolunteers = selectedTransportService.volunteers;
    const volunteerIds = serviceVolunteers.map(
      (volunteer) => volunteer.volunteerId,
    );
    const volunteerLabels = serviceVolunteers.map((volunteer) =>
      normalizeLookupLabel(volunteer.fullName, volunteer.volunteerId),
    );
    const volunteerRoles = serviceVolunteers.map((volunteer) => volunteer.role);

    return {
      clientId: selectedTransportService.clientId,
      clientLabel: normalizeLookupLabel(
        selectedTransportService.clientDisplayName,
        selectedTransportService.clientId,
      ),
      pickupDestinationId: selectedTransportService.pickupDestinationId,
      pickupDestinationLabel: normalizeLookupLabel(
        selectedTransportService.pickupDestinationDisplayName,
        selectedTransportService.pickupDestinationId,
      ),
      pickupDestinationDescription: "",
      transportType: selectedTransportService.transportType,
      scheduledAt: selectedTransportService.scheduledAt,
      scheduledEnd: selectedTransportService.scheduledEnd ?? null,
      serviceStatus: selectedTransportService.status,
      dropoffAddress: selectedTransportService.dropoffAddress,
      dropoffCity: selectedTransportService.dropoffCity,
      dropoffProvince: selectedTransportService.dropoffProvince,
      vehicleId: selectedTransportService.vehicleId ?? "",
      vehicleLabel: normalizeLookupLabel(
        selectedTransportService.vehicleDisplayName,
        selectedTransportService.vehicleId,
      ),
      vehicleSecondaryLabel: selectedTransportService.vehicleDescription ?? "",
      volunteerIds,
      volunteerLabels,
      volunteerRoles,
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
      pickupDestinationDescription: "",
      transportType: "sociale",
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
    if (!openedServiceId || !selectedTransportService) {
      setDetailTransportSheet(null);
      setIsDetailTransportSheetLoading(false);
      return;
    }

    let disposed = false;

    const loadDetailTransportSheet = async () => {
      setIsDetailTransportSheetLoading(true);

      try {
        const sheet = await getTransportSheetByTransportServiceId(
          selectedTransportService.id,
        );
        if (!disposed) {
          setDetailTransportSheet(sheet);
        }
      } catch (error) {
        if (!disposed && error instanceof ApiError && error.status === 404) {
          setDetailTransportSheet(null);
        }
      } finally {
        if (!disposed) {
          setIsDetailTransportSheetLoading(false);
        }
      }
    };

    void loadDetailTransportSheet();

    return () => {
      disposed = true;
    };
  }, [openedServiceId, selectedTransportService, reloadKey]);

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
    await createService(values);
  };

  const handleEditService = async (values: TransportServiceFormData) => {
    if (!selectedTransportService) {
      return;
    }

    await editService(selectedTransportService, values);
  };

  const handleAcceptService = async () => {
    if (!selectedTransportService) {
      return;
    }

    await acceptService(selectedTransportService.id);
  };

  const handleStartService = async () => {
    if (!selectedTransportService) {
      return;
    }

    await startService(selectedTransportService.id);
  };

  const loadTransportSheetForService = async (params: {
    serviceId: string;
    status: TransportServiceStatus;
    fromAdvance: boolean;
  }) => {
    const { serviceId, status, fromAdvance } = params;

    const shouldInitializeFirst = fromAdvance || status === "in_progress";
    const mustAlreadyExist = status === "completed";

    if (mustAlreadyExist) {
      return getTransportSheetByTransportServiceId(serviceId);
    }

    if (shouldInitializeFirst) {
      try {
        return await initializeTransportSheetByTransportServiceId(serviceId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          return getTransportSheetByTransportServiceId(serviceId);
        }

        throw error;
      }
    }

    try {
      return await getTransportSheetByTransportServiceId(serviceId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        try {
          return await initializeTransportSheetByTransportServiceId(serviceId);
        } catch (initializeError) {
          if (
            initializeError instanceof ApiError &&
            initializeError.status === 409
          ) {
            return getTransportSheetByTransportServiceId(serviceId);
          }

          throw initializeError;
        }
      }

      throw error;
    }
  };

  const openTransportSheetDialogWithData = (sheet: TransportSheet) => {
    if (!selectedTransportService) {
      return;
    }

    const volunteerNameById = new Map(
      selectedTransportService.volunteers.map((volunteer) => [
        volunteer.volunteerId,
        `${volunteer.fullName.trim() || volunteer.volunteerId} (${volunteer.role === "driver" ? "Autista" : "Accompagnatore"})`,
      ]),
    );
    const mappedFormValues = toTransportSheetFormData(sheet);
    const normalizedVolunteerIds =
      mappedFormValues.volunteerIds.length > 0
        ? mappedFormValues.volunteerIds
        : selectedTransportService.volunteers.map(
            (volunteer) => volunteer.volunteerId,
          );
    const volunteerDisplayNames = normalizedVolunteerIds.map(
      (volunteerId) => volunteerNameById.get(volunteerId) ?? volunteerId,
    );
    const normalizedFormValues: TransportSheetFormData = {
      ...mappedFormValues,
      organizationId:
        mappedFormValues.organizationId.trim() || scopedOrganizationId || "",
      destinationAddress: mappedFormValues.destinationAddress,
      volunteerIds: normalizedVolunteerIds,
      volunteerDisplayNames,
    };

    setTransportSheetId(sheet.id ?? null);
    setTransportSheetFormValues(normalizedFormValues);
    setDetailTransportSheet(sheet);
    setIsTransportSheetDialogOpen(true);
  };

  const handleOpenTransportSheetForEdit = async () => {
    if (!selectedTransportService) {
      return;
    }

    if (!canOpenTransportSheet) {
      setActionToast({
        message:
          "Non hai i permessi per compilare la scheda di questo servizio.",
        severity: "warning",
      });
      return;
    }

    setIsTransportSheetSubmitting(true);
    setTransportSheetError(null);

    try {
      const sheet = await getTransportSheetByTransportServiceId(
        selectedTransportService.id,
      );
      openTransportSheetDialogWithData(sheet);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        const missingSheetMessage =
          "Scheda trasporto non trovata: impossibile aprire la modifica.";
        setTransportSheetError(missingSheetMessage);
        setActionToast({ message: missingSheetMessage, severity: "warning" });
        return;
      }

      const message = getErrorMessage(
        error,
        "Apertura scheda trasporto non riuscita.",
      );
      setTransportSheetError(message);
      setActionToast({
        message,
        severity: "error",
      });
    } finally {
      setIsTransportSheetSubmitting(false);
    }
  };

  const handleOpenTransportSheet = async (options?: {
    fromAdvance?: boolean;
  }) => {
    if (!selectedTransportService) {
      return;
    }

    const fromAdvance = options?.fromAdvance === true;

    if (!canOpenTransportSheet) {
      setActionToast({
        message:
          "Non hai i permessi per compilare la scheda di questo servizio.",
        severity: "warning",
      });
      return;
    }

    setIsTransportSheetSubmitting(true);
    setTransportSheetError(null);

    try {
      const sheet: TransportSheet = await loadTransportSheetForService({
        serviceId: selectedTransportService.id,
        status: selectedTransportService.status,
        fromAdvance,
      });
      openTransportSheetDialogWithData(sheet);
    } catch (error) {
      if (
        selectedTransportService.status === "completed" &&
        error instanceof ApiError &&
        error.status === 404
      ) {
        const missingSheetMessage =
          "Servizio completato ma scheda trasporto non trovata. Verifica allineamento backend.";
        setTransportSheetError(missingSheetMessage);
        setActionToast({ message: missingSheetMessage, severity: "error" });
        return;
      }

      if (
        error instanceof Error &&
        error.message.startsWith("Invalid transport-sheets payload")
      ) {
        const invalidPayloadMessage =
          "Il backend ha risposto ma il DTO scheda e incompleto per l'apertura della form. Verifica i campi obbligatori della risposta initialize/get.";
        setTransportSheetError(invalidPayloadMessage);
        setActionToast({ message: invalidPayloadMessage, severity: "error" });
        return;
      }

      const message = getErrorMessage(
        error,
        "Apertura scheda trasporto non riuscita.",
      );
      setTransportSheetError(message);
      setActionToast({
        message,
        severity: "error",
      });
    } finally {
      setIsTransportSheetSubmitting(false);
    }
  };

  const handleSubmitTransportSheet = async (values: TransportSheetFormData) => {
    if (!selectedTransportService) {
      return;
    }

    setIsTransportSheetSubmitting(true);
    setTransportSheetError(null);

    try {
      if (transportSheetId) {
        const updatedSheet = await updateTransportSheet(
          transportSheetId,
          values,
        );
        setDetailTransportSheet(updatedSheet);
      } else {
        const createdSheet = await createTransportSheet(
          selectedTransportService.id,
          values,
        );
        setTransportSheetId(createdSheet.id ?? null);
        setDetailTransportSheet(createdSheet);
      }

      setIsTransportSheetDialogOpen(false);
      setReloadKey((current) => current + 1);

      const refreshedService = await getTransportServiceById(
        selectedTransportService.id,
      );
      setSelectedServiceFallback(refreshedService);
    } catch (error) {
      setTransportSheetError(
        getErrorMessage(error, "Salvataggio scheda trasporto non riuscito."),
      );
    } finally {
      setIsTransportSheetSubmitting(false);
    }
  };

  const handleOpenDeleteTransportSheetDialog = () => {
    if (!selectedTransportService || !canDeleteTransportSheet) {
      return;
    }

    setTransportSheetError(null);
    setIsDeleteTransportSheetDialogOpen(true);
  };

  const handleDeleteTransportSheet = async () => {
    if (!selectedTransportService) {
      return;
    }

    setIsDeletingTransportSheet(true);
    setTransportSheetError(null);

    try {
      const existingSheet = await getTransportSheetByTransportServiceId(
        selectedTransportService.id,
      );

      if (!existingSheet.id) {
        throw new Error("Scheda trasporto senza identificativo eliminabile.");
      }

      await deleteTransportSheet(existingSheet.id);
      setTransportSheetId(null);
      setTransportSheetFormValues(undefined);
      setDetailTransportSheet(null);
      setIsDeleteTransportSheetDialogOpen(false);
      setReloadKey((current) => current + 1);

      const refreshedService = await getTransportServiceById(
        selectedTransportService.id,
      );
      setSelectedServiceFallback(refreshedService);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        const notFoundMessage =
          "Nessuna scheda trasporto da eliminare per questo servizio.";
        setTransportSheetError(notFoundMessage);
        setActionToast({ message: notFoundMessage, severity: "warning" });
      } else {
        const message = getErrorMessage(
          error,
          "Eliminazione scheda trasporto non riuscita.",
        );
        setTransportSheetError(message);
        setActionToast({ message, severity: "error" });
      }
    } finally {
      setIsDeletingTransportSheet(false);
    }
  };

  const handleCancelService = async () => {
    if (!selectedTransportService) {
      return;
    }

    setIsCancelDialogOpen(false);
    await cancelService(selectedTransportService.id);
  };

  const handleOpenAssignDialog = () => {
    if (!selectedTransportService) {
      return;
    }

    setAssignDialogInitialTeamMembers(
      selectedTransportService.volunteers.map((volunteer) => ({
        volunteerId: volunteer.volunteerId,
        label: volunteer.fullName.trim(),
        role: volunteer.role,
      })),
    );
    setAssignDialogInitialNote(selectedTransportService.note ?? "");
    setIsAssignDialogOpen(true);
  };

  const handleAssignResources = async (
    teamMembers: AssignDialogMember[],
    note: string,
  ) => {
    if (!selectedTransportService || !session?.userId) {
      return false;
    }

    const didAssign = await assignResources(
      selectedTransportService.id,
      teamMembers.map((member) => ({
        volunteerId: member.volunteerId,
        role: member.role,
      })),
      note,
    );

    return didAssign;
  };

  const handleVolunteerSelfAssign = async () => {
    if (!selectedTransportService) {
      return;
    }

    await volunteerSelfAssign(selectedTransportService.id);
  };

  const handleVolunteerSelfRemove = async () => {
    if (!selectedTransportService) {
      return;
    }

    await volunteerSelfRemove(selectedTransportService.id);
  };

  const handleOpenVolunteerVehicleDialog = () => {
    if (!selectedTransportService) {
      return;
    }

    setVehicleDialogInitialId(selectedTransportService.vehicleId ?? "");
    setVehicleDialogInitialLabel(
      selectedTransportService.vehicleDisplayName ?? "",
    );
    setVehicleDialogInitialDescription(
      selectedTransportService.vehicleDescription ?? "",
    );
    setVehicleDialogInitialNote(selectedTransportService.note ?? "");
    setIsVolunteerVehicleDialogOpen(true);
  };

  const handleAssignVehicle = async (vehicleId: string, note: string) => {
    if (!selectedTransportService) {
      return false;
    }

    const didAssign = isVolunteer
      ? await volunteerAssignVehicle(
          selectedTransportService.id,
          vehicleId,
          note,
        )
      : await assignVehicle(selectedTransportService.id, vehicleId, note);

    return didAssign;
  };

  const handleVolunteerRemoveVehicle = async () => {
    if (!selectedTransportService) {
      return;
    }

    await volunteerRemoveVehicle(selectedTransportService.id);
  };

  const handleOverrideRemoveVolunteer = async (volunteerId: string) => {
    if (!selectedTransportService || !volunteerId.trim()) {
      return;
    }

    await overrideRemoveVolunteer(selectedTransportService.id, volunteerId);
  };

  const handleOverrideRemoveVehicle = async () => {
    if (!selectedTransportService) {
      return;
    }

    await overrideRemoveVehicle(selectedTransportService.id);
  };

  const handleOpenRescheduleDialog = () => {
    if (!selectedTransportService) {
      return;
    }

    setRescheduleDialogInitialAt(selectedTransportService.scheduledAt);
    setRescheduleDialogInitialEndAt(
      selectedTransportService.scheduledEnd ?? "",
    );
    setIsRescheduleDialogOpen(true);
  };

  const handleRescheduleService = async (
    nextScheduledAt: string,
    nextScheduledEnd: string | null,
  ) => {
    if (!selectedTransportService) {
      return false;
    }

    const expectedVersion =
      selectedTransportService.scheduleVersion > 0
        ? selectedTransportService.scheduleVersion
        : undefined;

    const didReschedule = await rescheduleService(
      selectedTransportService.id,
      selectedTransportService.scheduledAt,
      selectedTransportService.scheduledEnd,
      nextScheduledAt,
      nextScheduledEnd,
      expectedVersion,
    );

    return didReschedule;
  };

  const handleDeleteService = async () => {
    if (!selectedTransportService) {
      return;
    }

    setDeleteServiceError(null);
    setIsDeleteServiceSubmitting(true);

    try {
      await deleteTransportService(selectedTransportService.id);
      setSelectedServiceId(null);
      setSelectedServiceFallback(null);
      setReloadKey((current) => current + 1);
      setIsDeleteServiceDialogOpen(false);
    } catch (error) {
      setDeleteServiceError(
        getErrorMessage(error, "Eliminazione servizio non riuscita."),
      );
    } finally {
      setIsDeleteServiceSubmitting(false);
    }
  };

  const handleStatusFilterChange = (value: TransportStatusFilter) => {
    setStatusFilter(value);
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
        const rangeStartUtc = toUtcIsoOrUndefined(gridRangeStartLocal);
        const rangeEndUtc = toUtcIsoOrUndefined(gridRangeEndLocal);

        const servicePage = await searchTransportServices({
          pageIndex: paginationModel.page,
          pageSize: paginationModel.pageSize,
          searchText: debouncedSearchText || undefined,
          sortBy: sanitizeTransportSortField(sort?.field),
          sortDescending: sort?.sort === "desc",
          organizationId: scopedOrganizationId,
          status: selectedStatus,
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
          const userMessage = getErrorMessage(
            error,
            "Caricamento servizi trasporto non riuscito.",
          );

          setListError(userMessage);
          setActionToast({
            message: userMessage,
            severity: "error",
          });
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
    setActionToast,
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
            [item.address, item.city, item.province]
              .filter(Boolean)
              .join(", ") || undefined,
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

  const canCancel =
    canUseLifecycleActions &&
    selectedTransportService?.status !== "completed" &&
    selectedTransportService?.status !== "cancelled";
  const canAssign =
    !isVolunteer &&
    (selectedTransportService?.status === "accepted" ||
      selectedTransportService?.status === "assigned");
  const canReschedule = canCancel;

  const canEdit = Boolean(
    canManageServiceCrud &&
    selectedTransportService?.status !== "in_progress" &&
    selectedTransportService?.status !== "completed" &&
    selectedTransportService?.status !== "cancelled",
  );
  const canDelete = Boolean(
    canManageServiceCrud && selectedTransportService?.status !== "cancelled",
  );

  const isCurrentVolunteerAssigned = Boolean(
    isVolunteer &&
    selectedTransportService &&
    session?.userId &&
    selectedTransportService.volunteers.some(
      (volunteer) => volunteer.userId === session.userId,
    ),
  );

  const canOpenTransportSheet = Boolean(
    selectedTransportService &&
    (canManageServiceCrud || (isVolunteer && isCurrentVolunteerAssigned)),
  );

  const canManageTransportSheetActions = Boolean(
    selectedTransportService &&
    (canManageServiceCrud || (isVolunteer && isCurrentVolunteerAssigned)),
  );

  const canEditTransportSheet = Boolean(
    canManageTransportSheetActions &&
    selectedTransportService?.status !== "cancelled",
  );

  const canDeleteTransportSheet = canEditTransportSheet;

  const canVolunteerAccept = Boolean(
    isVolunteer &&
    selectedTransportService &&
    !isCurrentVolunteerAssigned &&
    (selectedTransportService.status === "accepted" ||
      selectedTransportService.status === "assigned"),
  );

  const canVolunteerRemove = Boolean(
    isVolunteer &&
    selectedTransportService &&
    isCurrentVolunteerAssigned &&
    selectedTransportService.status === "assigned",
  );

  const canChangeVehicle = Boolean(isVolunteer || canManageServiceCrud);

  const nextLifecycleStatusLabel = (() => {
    if (!selectedTransportService || isVolunteer) {
      return null;
    }

    if (selectedTransportService.status === "pending") {
      return "Accettato";
    }

    if (selectedTransportService.status === "accepted") {
      return "Assegnato";
    }

    if (selectedTransportService.status === "assigned") {
      return "In corso";
    }

    if (selectedTransportService.status === "in_progress") {
      return "Compila scheda";
    }

    return null;
  })();

  const handleAdvanceStatus = () => {
    if (!selectedTransportService || isVolunteer) {
      return;
    }

    if (selectedTransportService.status === "pending") {
      void handleAcceptService();
      return;
    }

    if (selectedTransportService.status === "accepted") {
      handleOpenAssignDialog();
      return;
    }

    if (selectedTransportService.status === "assigned") {
      void handleStartService();
      return;
    }

    if (selectedTransportService.status === "in_progress") {
      void handleOpenTransportSheet({ fromAdvance: true });
    }
  };

  const handleOpenAssignmentAction = () => {
    handleOpenAssignDialog();
  };

  if (!scopedOrganizationId) {
    return (
      <ErrorState
        title="Contesto organizzazione non disponibile."
        description="Seleziona un'organizzazione per usare la workspace trasporti."
      />
    );
  }

  return (
    <Stack spacing={2} sx={{ mt: { xs: -0.5, md: -1 } }}>
      <ContentCard className="backdrop-blur-none p-2 md:p-2.5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Box
              sx={{
                ...workspaceHeaderIconSx,
                width: { xs: 34, md: 36 },
                height: { xs: 34, md: 36 },
                borderRadius: 1.5,
              }}
            >
              <LocalShipping sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="sectionEyebrow" sx={{ fontSize: 13 }}>
              Trasporto socio-sanitario
            </Typography>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeView !== "calendar" ? (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  sx={{
                    ...workspacePrimaryActionButtonSx,
                    minHeight: 34,
                    px: 1.35,
                  }}
                  disabled={!canManageServiceCrud}
                  onClick={() => {
                    if (!canManageServiceCrud) {
                      return;
                    }

                    setCalendarCreateSeed(null);
                    createDialog.open();
                  }}
                >
                  Nuovo
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Edit />}
                  sx={{
                    ...workspacePrimaryActionButtonSx,
                    minHeight: 34,
                    px: 1.35,
                  }}
                  disabled={!selectedTransportService || !canEdit}
                  onClick={() => {
                    if (!canEdit) {
                      return;
                    }

                    editDialog.open();
                  }}
                >
                  Modifica
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  color="error"
                  startIcon={<DeleteOutline />}
                  sx={{ minHeight: 34, px: 1.35 }}
                  disabled={!selectedTransportService || !canDelete}
                  onClick={() => {
                    if (!canDelete) {
                      return;
                    }

                    setDeleteServiceError(null);
                    setIsDeleteServiceDialogOpen(true);
                  }}
                >
                  Elimina
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<FileDownload />}
                  sx={workspaceCompactPrimaryActionButtonSx}
                  onClick={() =>
                    exportRowsToExcel(
                      rows,
                      transportServicesExportColumns,
                      "servizi-trasporto",
                    )
                  }
                >
                  Export Excel
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
              sx={{
                ...workspaceViewToggleGroupSx,
                "& .MuiToggleButton-root": {
                  ...((workspaceViewToggleGroupSx as Record<string, unknown>)[
                    "& .MuiToggleButton-root"
                  ] as object),
                  minHeight: 34,
                  px: 1.2,
                  fontSize: "0.82rem",
                },
              }}
            >
              <ToggleButton value="grid">
                <ViewList sx={{ fontSize: 16, mr: 0.6 }} /> Lista
              </ToggleButton>
              <ToggleButton value="calendar">
                <CalendarMonth sx={{ fontSize: 16, mr: 0.6 }} /> Calendario
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>
      </ContentCard>

      <ContentCard className="backdrop-blur-none p-2 md:p-2.5">
        <Stack spacing={2}>
          {activeView === "grid" ? (
            <Stack spacing={1.25}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Cerca"
                  placeholder="Cerca per cliente, stato o destinazione"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
                <TextField
                  select
                  fullWidth
                  size="small"
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
                    size="small"
                    sx={{
                      width: 34,
                      height: 34,
                      alignSelf: "center",
                      borderRadius: 1.5,
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
                  spacing={1}
                  sx={{ pt: 0.25 }}
                  direction={{ xs: "column", md: "row" }}
                >
                  <Box sx={{ width: "100%" }}>
                    <EntityLookupDialogField
                      label="Filtra per volontari"
                      dialogTitle="Seleziona volontari"
                      value={volunteerFilterIds}
                      selectedOptions={volunteerFilterIds.map((id, index) => ({
                        id,
                        label: volunteerFilterLabels[index],
                      }))}
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
                    size="small"
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
                    size="small"
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
        onAssign={handleOpenAssignmentAction}
        onReschedule={handleOpenRescheduleDialog}
        onEdit={() => {
          if (!canEdit) {
            return;
          }

          editDialog.open();
        }}
        onDelete={() => {
          if (!canDelete) {
            return;
          }

          setDeleteServiceError(null);
          setIsDeleteServiceDialogOpen(true);
        }}
        onEditTransportSheet={() => {
          if (!canEditTransportSheet) {
            return;
          }

          void handleOpenTransportSheetForEdit();
        }}
        onDeleteTransportSheet={handleOpenDeleteTransportSheetDialog}
        onCancelService={() => setIsCancelDialogOpen(true)}
        onSelfAssign={() => {
          void handleVolunteerSelfAssign();
        }}
        onSelfRemove={() => {
          void handleVolunteerSelfRemove();
        }}
        onAssignVehicle={() => {
          handleOpenVolunteerVehicleDialog();
        }}
        onRemoveVehicle={() => {
          if (isVolunteer) {
            void handleVolunteerRemoveVehicle();
            return;
          }

          void handleOverrideRemoveVehicle();
        }}
        onRemoveVolunteer={(volunteerId) => {
          void handleOverrideRemoveVolunteer(volunteerId);
        }}
        canAssign={Boolean(canAssign)}
        canReschedule={Boolean(canReschedule)}
        canCancel={Boolean(canCancel)}
        canEdit={canEdit}
        canDelete={canDelete}
        canManageTransportSheetActions={canManageTransportSheetActions}
        canEditTransportSheet={canEditTransportSheet}
        canDeleteTransportSheet={canDeleteTransportSheet}
        transportSheetSummary={detailTransportSheet}
        isTransportSheetSummaryLoading={isDetailTransportSheetLoading}
        canSelfAssign={canVolunteerAccept}
        canSelfRemove={canVolunteerRemove}
        canAssignVehicle={canChangeVehicle}
        canRemoveVehicle={isVolunteer || canOverrideAssignments}
        canAdvanceStatus={Boolean(nextLifecycleStatusLabel)}
        nextStatusLabel={nextLifecycleStatusLabel}
        isVolunteerView={isVolunteer}
        canOverrideRemoveVolunteer={canOverrideAssignments}
        canOverrideRemoveVehicle={canOverrideAssignments}
        onAdvanceStatus={handleAdvanceStatus}
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

      <TransportSheetFormDialog
        open={isTransportSheetDialogOpen}
        isSubmitting={isTransportSheetSubmitting}
        submitError={transportSheetError}
        initialValues={transportSheetFormValues}
        onClose={() => {
          setIsTransportSheetDialogOpen(false);
        }}
        onSubmit={handleSubmitTransportSheet}
      />

      <AssignVolunteersDialog
        open={isAssignDialogOpen}
        isSubmitting={isActionSubmitting}
        organizationId={scopedOrganizationId}
        initialTeamMembers={assignDialogInitialTeamMembers}
        initialNote={assignDialogInitialNote}
        onSearchVolunteers={searchVolunteerLookup}
        onClose={() => setIsAssignDialogOpen(false)}
        onSubmit={handleAssignResources}
      />

      <AssignVehicleDialog
        open={isVolunteerVehicleDialogOpen}
        isSubmitting={isActionSubmitting}
        organizationId={scopedOrganizationId}
        initialVehicleId={vehicleDialogInitialId}
        initialVehicleLabel={vehicleDialogInitialLabel}
        initialVehicleDescription={vehicleDialogInitialDescription}
        initialNote={vehicleDialogInitialNote}
        onSearchVehicles={searchVehicleLookup}
        onClose={() => setIsVolunteerVehicleDialogOpen(false)}
        onSubmit={handleAssignVehicle}
      />

      <RescheduleServiceDialog
        open={isRescheduleDialogOpen}
        isSubmitting={isActionSubmitting}
        initialScheduledAt={rescheduleDialogInitialAt}
        initialScheduledEnd={rescheduleDialogInitialEndAt}
        onClose={() => setIsRescheduleDialogOpen(false)}
        onSubmit={handleRescheduleService}
      />

      <DeleteTransportSheetDialog
        open={isDeleteTransportSheetDialogOpen}
        isConfirming={isDeletingTransportSheet}
        errorMessage={transportSheetError}
        onClose={() => setIsDeleteTransportSheetDialogOpen(false)}
        onConfirm={handleDeleteTransportSheet}
      />

      <CancelTransportServiceDialog
        open={isCancelDialogOpen}
        isConfirming={isActionSubmitting}
        errorMessage={actionError}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancelService}
      />

      <DeleteTransportServiceDialog
        open={isDeleteServiceDialogOpen}
        isConfirming={isDeleteServiceSubmitting}
        errorMessage={deleteServiceError}
        onClose={() => setIsDeleteServiceDialogOpen(false)}
        onConfirm={handleDeleteService}
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
