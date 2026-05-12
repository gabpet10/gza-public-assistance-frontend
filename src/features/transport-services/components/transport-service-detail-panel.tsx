import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Chip,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { ContentCard } from "@/shared/ui/content-card";
import { LoadingState } from "@/shared/ui/feedback-states";
import type {
  TransportAssignmentRole,
  TransportService,
  TransportServiceStatus,
} from "@/features/transport-services/api/types";
import {
  getTransportStatusChipSx,
  getTransportStatusLabel,
  getTransportTypeLabel,
} from "@/features/transport-services/components/transport-service-status-ui";
import {
  workspaceCompactPrimaryActionButtonSx,
  workspaceCompactSecondaryActionButtonSx,
  workspaceDetailCloseButtonSx,
} from "@/shared/ui/workspace-styles";
import {
  formatTransportDateTime as formatDateTime,
  formatTransportPlannedWindow as formatPlannedWindow,
} from "@/features/transport-services/components/transport-services-workspace-helpers";
import {
  AccessibilityNew,
  AssignmentInd,
  CheckCircleOutline,
  Diversity3,
  DeleteOutline,
  DirectionsCar,
  Edit,
  EventRepeat,
  ExpandMore,
  GroupAdd,
  Healing,
  LocalHospital,
  MedicalInformation,
  PlayArrow,
  SwapHoriz,
  VisibilityOutlined,
} from "@mui/icons-material";

type TransportServiceDetailPanelProps = {
  open: boolean;
  service: TransportService | null;
  isLoading: boolean;
  isActionSubmitting: boolean;
  errorMessage?: string | null;
  actionErrorMessage?: string | null;
  onAssign: () => void;
  onReschedule: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCancelService: () => void;
  onEditTransportSheet: () => void;
  onDeleteTransportSheet: () => void;
  onSelfAssign: () => void;
  onSelfRemove: () => void;
  onAssignVehicle: () => void;
  onRemoveVehicle: () => void;
  onAdvanceStatus: () => void;
  onRemoveVolunteer: (volunteerId: string) => void;
  canAssign: boolean;
  canReschedule: boolean;
  canCancel: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageTransportSheetActions: boolean;
  canEditTransportSheet: boolean;
  canDeleteTransportSheet: boolean;
  canSelfAssign: boolean;
  canSelfRemove: boolean;
  canAssignVehicle: boolean;
  canRemoveVehicle: boolean;
  canAdvanceStatus: boolean;
  nextStatusLabel: string | null;
  isVolunteerView: boolean;
  canOverrideRemoveVolunteer: boolean;
  canOverrideRemoveVehicle: boolean;
  transportSheetSummary: {
    sheetNumber: number | null;
    reportDate: string;
    destinationName: string;
    destinationAddress: string;
    destinationCity: string;
    destinationProvince: string;
    vehiclePlate: string;
    startTime: string | null;
    endTime: string | null;
    kmDeparture: number | null;
    kmArrival: number | null;
    volunteerIds: string[];
  } | null;
  isTransportSheetSummaryLoading: boolean;
  onClose: () => void;
};

function getDestinationLabel(service: TransportService) {
  return [service.dropoffAddress, service.dropoffCity, service.dropoffProvince]
    .filter(Boolean)
    .join(", ");
}

function getPickupLabel(service: TransportService) {
  return service.pickupDestinationDisplayName || service.pickupDestinationId;
}

function getStatusReachedAt(
  service: TransportService,
  status: TransportServiceStatus,
): string | null {
  switch (status) {
    case "pending":
      return service.createdAt;
    case "accepted":
      return service.acceptedAt;
    case "assigned":
      return service.assignedAt;
    case "in_progress":
      return service.startedAt;
    case "completed":
      return service.completedAt;
    case "cancelled":
      return service.cancelledAt;
    default:
      return null;
  }
}

function getVolunteerRoleLabel(role: TransportAssignmentRole | null) {
  if (!role) {
    return "Accompagnatore";
  }

  return role === "driver" ? "Autista" : "Accompagnatore";
}

function getNameInitials(value: string) {
  const parts = value
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() ?? "V";
  }

  return "V";
}

function getTransportTypeIcon(
  transportType: TransportService["transportType"],
) {
  const iconSx = { fontSize: 16, color: "var(--accent-secondary)" };

  if (transportType === "sanitario") {
    return <LocalHospital sx={iconSx} />;
  }

  if (transportType === "dimissione_ospedaliera") {
    return <Healing sx={iconSx} />;
  }

  if (transportType === "visita_programmata") {
    return <MedicalInformation sx={iconSx} />;
  }

  if (transportType === "dialisi") {
    return <LocalHospital sx={iconSx} />;
  }

  if (transportType === "riabilitazione") {
    return <AccessibilityNew sx={iconSx} />;
  }

  if (transportType === "trasferimento_struttura") {
    return <SwapHoriz sx={iconSx} />;
  }

  if (transportType === "accompagnamento_amministrativo") {
    return <AssignmentInd sx={iconSx} />;
  }

  return <Diversity3 sx={iconSx} />;
}

export function TransportServiceDetailPanel({
  open,
  service,
  isLoading,
  isActionSubmitting,
  errorMessage,
  actionErrorMessage,
  onAssign,
  onReschedule,
  onEdit,
  onDelete,
  onCancelService,
  onEditTransportSheet,
  onDeleteTransportSheet,
  onSelfAssign,
  onSelfRemove,
  onAssignVehicle,
  onRemoveVehicle,
  onAdvanceStatus,
  onRemoveVolunteer,
  canAssign,
  canReschedule,
  canCancel,
  canEdit,
  canDelete,
  canManageTransportSheetActions,
  canEditTransportSheet,
  canDeleteTransportSheet,
  canSelfAssign,
  canSelfRemove,
  canAssignVehicle,
  canRemoveVehicle,
  canAdvanceStatus,
  nextStatusLabel,
  isVolunteerView,
  canOverrideRemoveVolunteer,
  canOverrideRemoveVehicle,
  transportSheetSummary,
  isTransportSheetSummaryLoading,
  onClose,
}: TransportServiceDetailPanelProps) {
  const isExecutionOrClosedStatus =
    service?.status === "in_progress" ||
    service?.status === "completed" ||
    service?.status === "cancelled";

  const volunteerList = useMemo(() => {
    if (!service) {
      return [];
    }

    return service.volunteers.map((volunteer) => ({
      volunteerId: volunteer.volunteerId,
      name: volunteer.fullName.trim(),
      roleLabel: getVolunteerRoleLabel(volunteer.role),
    }));
  }, [service]);
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <div className="h-full w-[min(100vw,680px)] overflow-y-auto bg-[#fffdfa] p-4 md:p-5">
        <Stack spacing={2}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Typography variant="sectionEyebrow">
                Dettaglio servizio
              </Typography>
              <Typography variant="sectionTitle">
                {service?.clientDisplayName || service?.clientId || "Servizio"}
              </Typography>
              {isTransportSheetSummaryLoading ? (
                <Typography variant="bodySmall" color="text.secondary">
                  Caricamento dati scheda...
                </Typography>
              ) : null}
            </div>
            <IconButton onClick={onClose} sx={workspaceDetailCloseButtonSx}>
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </div>

          {isLoading ? (
            <LoadingState message="Caricamento dettaglio servizio..." />
          ) : null}
          {errorMessage && !service ? (
            <Alert severity="error">{errorMessage}</Alert>
          ) : null}
          {actionErrorMessage ? (
            <Alert severity="warning">{actionErrorMessage}</Alert>
          ) : null}

          {service ? (
            <>
              <ContentCard className="bg-white p-4">
                <Stack spacing={1.5}>
                  <Typography variant="sectionEyebrow">Azioni</Typography>
                  <div className="flex flex-wrap items-center gap-2">
                    {isVolunteerView ? (
                      <>
                        {canSelfAssign ? (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<CheckCircleOutline />}
                            sx={workspaceCompactPrimaryActionButtonSx}
                            disabled={isActionSubmitting}
                            onClick={onSelfAssign}
                          >
                            Accetta servizio
                          </Button>
                        ) : null}
                        {canSelfRemove ? (
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteOutline />}
                            sx={workspaceCompactSecondaryActionButtonSx}
                            disabled={isActionSubmitting}
                            onClick={onSelfRemove}
                          >
                            Rinuncia al servizio
                          </Button>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Edit />}
                          sx={workspaceCompactPrimaryActionButtonSx}
                          disabled={isActionSubmitting || !canEdit}
                          onClick={onEdit}
                        >
                          Modifica
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteOutline />}
                          sx={workspaceCompactSecondaryActionButtonSx}
                          disabled={isActionSubmitting || !canDelete}
                          onClick={onDelete}
                        >
                          Elimina
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<GroupAdd />}
                          sx={workspaceCompactPrimaryActionButtonSx}
                          disabled={isActionSubmitting || !canAssign}
                          onClick={onAssign}
                        >
                          Assegna volontari
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteOutline />}
                          sx={workspaceCompactSecondaryActionButtonSx}
                          disabled={isActionSubmitting || !canCancel}
                          onClick={onCancelService}
                        >
                          Annulla servizio
                        </Button>
                      </>
                    )}
                  </div>
                </Stack>
              </ContentCard>

              <ContentCard className="bg-white p-4">
                <Accordion disableGutters elevation={0} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="sectionEyebrow">
                      Dati servizio
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0 }}>
                    <div className="overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[#f7f9fc]">
                      <div className="grid grid-cols-[170px,1fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Stato
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            label={getTransportStatusLabel(service.status)}
                            sx={{
                              width: "fit-content",
                              fontWeight: 700,
                              ...getTransportStatusChipSx(service.status),
                            }}
                          />
                          {!isVolunteerView && canAdvanceStatus ? (
                            <Tooltip
                              title={
                                nextStatusLabel
                                  ? `Avanza a ${nextStatusLabel}`
                                  : "Avanza"
                              }
                            >
                              <span style={{ marginLeft: "auto" }}>
                                <IconButton
                                  size="small"
                                  aria-label={
                                    nextStatusLabel
                                      ? `Avanza a ${nextStatusLabel}`
                                      : "Avanza"
                                  }
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: "50%",
                                    color: "#ffffff",
                                    backgroundColor: "var(--accent-secondary)",
                                    "&:hover": {
                                      backgroundColor:
                                        "var(--accent-secondary)",
                                      opacity: 0.9,
                                    },
                                    "&.Mui-disabled": {
                                      backgroundColor:
                                        "rgba(15, 109, 122, 0.24)",
                                      color: "rgba(255, 255, 255, 0.7)",
                                    },
                                  }}
                                  disabled={isActionSubmitting}
                                  onClick={onAdvanceStatus}
                                >
                                  <PlayArrow fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : null}
                        </Stack>
                      </div>
                      <div className="grid grid-cols-[170px,1fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Tipologia
                        </Typography>
                        <Typography
                          variant="bodyMedium"
                          sx={{ fontWeight: 500 }}
                        >
                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                          >
                            {getTransportTypeIcon(service.transportType)}
                            <span>
                              {getTransportTypeLabel(service.transportType)}
                            </span>
                          </Stack>
                        </Typography>
                      </div>
                      <div className="grid grid-cols-[170px,1fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Cliente
                        </Typography>
                        <Typography
                          variant="bodyMedium"
                          sx={{ fontWeight: 500 }}
                        >
                          {service.clientDisplayName || service.clientId || "-"}
                        </Typography>
                      </div>
                      <div className="grid grid-cols-[170px,1fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Partenza
                        </Typography>
                        <Typography
                          variant="bodyMedium"
                          sx={{ fontWeight: 500 }}
                        >
                          {getDestinationLabel(service) || "-"}
                        </Typography>
                      </div>
                      <div className="grid grid-cols-[170px,1fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Destinazione
                        </Typography>
                        <Typography
                          variant="bodyMedium"
                          sx={{ fontWeight: 500 }}
                        >
                          {getPickupLabel(service) || "-"}
                        </Typography>
                      </div>
                      <div className="grid grid-cols-[170px,1fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Pagamento
                        </Typography>
                        <Typography
                          variant="bodyMedium"
                          sx={{ fontWeight: 500 }}
                        >
                          {service.isPaid
                            ? `A pagamento${
                                service.amount !== null
                                  ? ` · ${new Intl.NumberFormat("it-IT", {
                                      style: "currency",
                                      currency: "EUR",
                                    }).format(service.amount)}`
                                  : ""
                              }`
                            : "Non a pagamento"}
                        </Typography>
                      </div>
                      <div className="grid grid-cols-[170px,1fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Veicolo
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ width: "100%", minWidth: 0 }}
                        >
                          <Typography
                            variant="bodyMedium"
                            sx={{ fontWeight: 500, minWidth: 0, pr: 1 }}
                            noWrap
                          >
                            {service.vehicleDisplayName ||
                              service.vehicleId ||
                              "-"}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                            sx={{ flexShrink: 0 }}
                          >
                            {canAssignVehicle ? (
                              <Tooltip title="Cambia veicolo">
                                <span>
                                  <IconButton
                                    size="small"
                                    aria-label="Cambia veicolo"
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      borderRadius: "50%",
                                      color: "#ffffff",
                                      backgroundColor:
                                        "var(--accent-secondary)",
                                      "&:hover": {
                                        backgroundColor:
                                          "var(--accent-secondary)",
                                        opacity: 0.9,
                                      },
                                      "&.Mui-disabled": {
                                        backgroundColor:
                                          "rgba(15, 109, 122, 0.24)",
                                        color: "rgba(255, 255, 255, 0.7)",
                                      },
                                    }}
                                    disabled={
                                      isActionSubmitting ||
                                      isExecutionOrClosedStatus
                                    }
                                    onClick={onAssignVehicle}
                                  >
                                    <DirectionsCar fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : null}
                            {canRemoveVehicle ? (
                              <Tooltip title="Rimuovi veicolo">
                                <span>
                                  <IconButton
                                    size="small"
                                    aria-label="Rimuovi veicolo"
                                    data-can-override={
                                      canOverrideRemoveVehicle
                                        ? "true"
                                        : "false"
                                    }
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      borderRadius: "50%",
                                      color: "#ffffff",
                                      backgroundColor: "#c62828",
                                      "&:hover": {
                                        backgroundColor: "#b71c1c",
                                      },
                                      "&.Mui-disabled": {
                                        backgroundColor:
                                          "rgba(198, 40, 40, 0.32)",
                                        color: "rgba(255, 255, 255, 0.7)",
                                      },
                                    }}
                                    disabled={
                                      isActionSubmitting ||
                                      isExecutionOrClosedStatus
                                    }
                                    onClick={onRemoveVehicle}
                                  >
                                    <DeleteOutline fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : null}
                          </Stack>
                        </Stack>
                      </div>
                      <div className="grid grid-cols-[170px,1fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Pianificato per
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ width: "100%" }}
                        >
                          <Typography
                            variant="bodyMedium"
                            sx={{ fontWeight: 500 }}
                          >
                            {formatPlannedWindow(
                              service.scheduledAt,
                              service.scheduledEnd,
                            )}
                          </Typography>
                          {!isVolunteerView && canReschedule ? (
                            <Tooltip title="Sposta servizio">
                              <span style={{ marginLeft: "auto" }}>
                                <IconButton
                                  size="small"
                                  aria-label="Sposta servizio"
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: "50%",
                                    color: "#ffffff",
                                    backgroundColor: "var(--accent-secondary)",
                                    "&:hover": {
                                      backgroundColor:
                                        "var(--accent-secondary)",
                                      opacity: 0.9,
                                    },
                                    "&.Mui-disabled": {
                                      backgroundColor:
                                        "rgba(15, 109, 122, 0.24)",
                                      color: "rgba(255, 255, 255, 0.7)",
                                    },
                                  }}
                                  disabled={
                                    isActionSubmitting ||
                                    isExecutionOrClosedStatus
                                  }
                                  onClick={onReschedule}
                                >
                                  <EventRepeat fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : null}
                        </Stack>
                      </div>
                      <div className="grid grid-cols-[170px,1fr] items-center gap-4 px-4 py-3">
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Note
                        </Typography>
                        <Typography
                          variant="bodyMedium"
                          sx={{ fontWeight: 500 }}
                        >
                          {service.note || "-"}
                        </Typography>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>
              </ContentCard>

              {transportSheetSummary ? (
                <ContentCard className="bg-white p-4">
                  <Accordion disableGutters elevation={0} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="sectionEyebrow">
                        Dati effettivi trasporto
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0 }}>
                      <div className="overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[#f7f9fc]">
                        <div className="grid grid-cols-[170px,1fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                          <Typography
                            variant="bodySmall"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Scheda
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ width: "100%", minWidth: 0 }}
                          >
                            <Typography
                              variant="bodyMedium"
                              sx={{ fontWeight: 500 }}
                            >
                              N. {transportSheetSummary.sheetNumber ?? "-"} ·{" "}
                              {formatDateTime(transportSheetSummary.reportDate)}
                            </Typography>
                            {canManageTransportSheetActions ? (
                              <div className="flex items-center gap-1">
                                <Tooltip title="Modifica scheda">
                                  <span>
                                    <IconButton
                                      size="small"
                                      aria-label="Modifica scheda"
                                      sx={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: "50%",
                                        color: "#ffffff",
                                        backgroundColor:
                                          "var(--accent-secondary)",
                                        "&:hover": {
                                          backgroundColor:
                                            "var(--accent-secondary)",
                                          opacity: 0.9,
                                        },
                                        "&.Mui-disabled": {
                                          backgroundColor:
                                            "rgba(15, 109, 122, 0.24)",
                                          color: "rgba(255, 255, 255, 0.7)",
                                        },
                                      }}
                                      disabled={
                                        isActionSubmitting ||
                                        !canEditTransportSheet
                                      }
                                      onClick={onEditTransportSheet}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Elimina scheda">
                                  <span>
                                    <IconButton
                                      size="small"
                                      aria-label="Elimina scheda"
                                      sx={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: "50%",
                                        color: "#ffffff",
                                        backgroundColor: "#c62828",
                                        "&:hover": {
                                          backgroundColor: "#b71c1c",
                                        },
                                        "&.Mui-disabled": {
                                          backgroundColor:
                                            "rgba(198, 40, 40, 0.32)",
                                          color: "rgba(255, 255, 255, 0.7)",
                                        },
                                      }}
                                      disabled={
                                        isActionSubmitting ||
                                        !canDeleteTransportSheet
                                      }
                                      onClick={onDeleteTransportSheet}
                                    >
                                      <DeleteOutline fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </div>
                            ) : null}
                          </Stack>
                        </div>
                        <div className="grid grid-cols-[170px,1fr] items-center gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                          <Typography
                            variant="bodySmall"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Date/ora effettive
                          </Typography>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={{ xs: 0.25, md: 2 }}
                          >
                            <Typography
                              variant="bodyMedium"
                              sx={{ fontWeight: 500 }}
                            >
                              Partenza:{" "}
                              {formatDateTime(transportSheetSummary.startTime)}
                            </Typography>
                            <Typography
                              variant="bodyMedium"
                              sx={{ fontWeight: 500 }}
                            >
                              Arrivo:{" "}
                              {formatDateTime(transportSheetSummary.endTime)}
                            </Typography>
                          </Stack>
                        </div>
                        <div className="grid grid-cols-[170px,1fr] items-center gap-4 px-4 py-3">
                          <Typography
                            variant="bodySmall"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Chilometri
                          </Typography>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={{ xs: 0.25, md: 2 }}
                          >
                            <Typography
                              variant="bodyMedium"
                              sx={{ fontWeight: 500 }}
                            >
                              Partenza:{" "}
                              {transportSheetSummary.kmDeparture ?? "-"}
                            </Typography>
                            <Typography
                              variant="bodyMedium"
                              sx={{ fontWeight: 500 }}
                            >
                              Arrivo: {transportSheetSummary.kmArrival ?? "-"}
                            </Typography>
                          </Stack>
                        </div>
                      </div>
                    </AccordionDetails>
                  </Accordion>
                </ContentCard>
              ) : null}

              <ContentCard className="bg-white p-4">
                <Accordion disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="sectionEyebrow">
                      Avanzamento stato
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0 }}>
                    <div className="overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[#f7f9fc]">
                      {(
                        [
                          "pending",
                          "accepted",
                          "assigned",
                          "in_progress",
                          "completed",
                          "cancelled",
                        ] as TransportServiceStatus[]
                      ).map((status, index, allStatuses) => {
                        const reachedAt = getStatusReachedAt(service, status);
                        return (
                          <div
                            key={status}
                            className={`grid grid-cols-[170px,1fr] items-center gap-4 px-4 py-3 ${
                              index < allStatuses.length - 1
                                ? "border-b border-[color:var(--border-soft)]"
                                : ""
                            }`}
                          >
                            <Typography
                              variant="bodySmall"
                              color="text.secondary"
                              sx={{ fontWeight: 600 }}
                            >
                              {getTransportStatusLabel(status)}
                            </Typography>
                            <Typography
                              variant="bodyMedium"
                              sx={{ fontWeight: 500 }}
                              color={
                                reachedAt ? "text.primary" : "text.secondary"
                              }
                            >
                              {reachedAt
                                ? `Raggiunto il ${formatDateTime(reachedAt)}`
                                : "Non raggiunto"}
                            </Typography>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionDetails>
                </Accordion>
              </ContentCard>

              <ContentCard className="bg-white p-4">
                <Accordion disableGutters elevation={0} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ minWidth: 0 }}
                    >
                      <Typography variant="sectionEyebrow">
                        Volontari assegnati
                      </Typography>
                      <Chip
                        size="small"
                        label={String(volunteerList.length)}
                        sx={{
                          height: 22,
                          fontWeight: 800,
                          bgcolor: "rgba(15, 109, 122, 0.12)",
                          color: "var(--accent-secondary)",
                        }}
                      />
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0 }}>
                    {volunteerList.length > 0 ? (
                      <Stack spacing={1.15}>
                        {volunteerList.map((volunteer, index) => (
                          <Box
                            key={volunteer.volunteerId}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.2,
                              borderRadius: 2,
                              border: "1px solid rgba(15, 109, 122, 0.18)",
                              backgroundColor: "rgba(255, 255, 255, 0.75)",
                              px: 1.25,
                              py: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 30,
                                height: 30,
                                bgcolor: "rgba(15, 109, 122, 0.14)",
                                color: "var(--accent-secondary)",
                                fontWeight: 800,
                                fontSize: 12,
                              }}
                            >
                              {getNameInitials(volunteer.name ?? "Volontario")}
                            </Avatar>

                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              spacing={1}
                              sx={{ minWidth: 0, flex: 1 }}
                            >
                              <Stack sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="bodyMedium"
                                  sx={{ fontWeight: 700 }}
                                  noWrap
                                >
                                  {volunteer.name || `Volontario ${index + 1}`}
                                </Typography>
                              </Stack>

                              <Chip
                                size="small"
                                label={volunteer.roleLabel}
                                sx={{
                                  fontWeight: 700,
                                  bgcolor:
                                    volunteer.roleLabel === "Autista"
                                      ? "rgba(15, 109, 122, 0.15)"
                                      : "rgba(217, 95, 67, 0.14)",
                                  color:
                                    volunteer.roleLabel === "Autista"
                                      ? "var(--accent-secondary)"
                                      : "var(--accent)",
                                }}
                              />
                              {canOverrideRemoveVolunteer ? (
                                <IconButton
                                  size="small"
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: "50%",
                                    color: "#ffffff",
                                    backgroundColor: "#c62828",
                                    "&:hover": {
                                      backgroundColor: "#b71c1c",
                                    },
                                    "&.Mui-disabled": {
                                      backgroundColor:
                                        "rgba(198, 40, 40, 0.32)",
                                      color: "rgba(255, 255, 255, 0.7)",
                                    },
                                  }}
                                  disabled={
                                    isActionSubmitting ||
                                    !canOverrideRemoveVolunteer
                                  }
                                  onClick={() =>
                                    onRemoveVolunteer(volunteer.volunteerId)
                                  }
                                  aria-label="Rimuovi volontario"
                                >
                                  <DeleteOutline sx={{ fontSize: 16 }} />
                                </IconButton>
                              ) : null}
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Box
                        sx={{
                          borderRadius: 2,
                          border: "1px dashed rgba(15, 109, 122, 0.28)",
                          backgroundColor: "rgba(15, 109, 122, 0.04)",
                          px: 1.5,
                          py: 1.5,
                        }}
                      >
                        <Typography variant="bodySmall" color="text.secondary">
                          Nessun volontario assegnato al servizio.
                        </Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </ContentCard>
            </>
          ) : null}
        </Stack>
      </div>
    </Drawer>
  );
}
