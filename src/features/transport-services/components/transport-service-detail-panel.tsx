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
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Chip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
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
  workspaceDetailCloseButtonSx,
  workspacePrimaryActionButtonSx,
} from "@/shared/ui/workspace-styles";
import {
  AccessibilityNew,
  AssignmentInd,
  CheckCircleOutline,
  Diversity3,
  DeleteOutline,
  Edit,
  EventRepeat,
  ExpandMore,
  FlagCircle,
  GroupAdd,
  Healing,
  LocalHospital,
  MedicalInformation,
  PlayArrow,
  PublishedWithChanges,
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
  onAccept: () => void;
  onAssign: () => void;
  onStart: () => void;
  onComplete: () => void;
  onReschedule: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCancelService: () => void;
  onSelfAssign: () => void;
  onSelfRemove: () => void;
  onAssignVehicle: () => void;
  onRemoveVehicle: () => void;
  onRemoveVolunteer: (volunteerId: string) => void;
  canAccept: boolean;
  canAssign: boolean;
  canStart: boolean;
  canComplete: boolean;
  canReschedule: boolean;
  canCancel: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSelfAssign: boolean;
  canSelfRemove: boolean;
  canAssignVehicle: boolean;
  canRemoveVehicle: boolean;
  canOverrideRemoveVolunteer: boolean;
  canOverrideRemoveVehicle: boolean;
  onClose: () => void;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatPlannedWindow(
  startValue: string | null,
  endValue: string | null,
) {
  const startLabel = formatDateTime(startValue);
  if (startLabel === "-") {
    return "-";
  }

  if (!endValue) {
    return `${startLabel} · fine non impostata`;
  }

  const parsedStart = startValue ? new Date(startValue) : null;
  const parsedEnd = new Date(endValue);
  if (
    parsedStart &&
    !Number.isNaN(parsedStart.getTime()) &&
    !Number.isNaN(parsedEnd.getTime()) &&
    parsedStart.toDateString() === parsedEnd.toDateString()
  ) {
    const endTime = parsedEnd.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${startLabel} - ${endTime}`;
  }

  return `${startLabel} - ${formatDateTime(endValue)}`;
}

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
  onAccept,
  onAssign,
  onStart,
  onComplete,
  onReschedule,
  onEdit,
  onDelete,
  onCancelService,
  onSelfAssign,
  onSelfRemove,
  onAssignVehicle,
  onRemoveVehicle,
  onRemoveVolunteer,
  canAccept,
  canAssign,
  canStart,
  canComplete,
  canReschedule,
  canCancel,
  canEdit,
  canDelete,
  canSelfAssign,
  canSelfRemove,
  canAssignVehicle,
  canRemoveVehicle,
  canOverrideRemoveVolunteer,
  canOverrideRemoveVehicle,
  onClose,
}: TransportServiceDetailPanelProps) {
  const volunteerList = useMemo(() => {
    if (!service) {
      return [];
    }

    if (service.volunteers.length > 0) {
      return service.volunteers.map((volunteer) => ({
        volunteerId: volunteer.volunteerId,
        name: volunteer.fullName.trim(),
        roleLabel: getVolunteerRoleLabel(volunteer.role),
      }));
    }

    const fallbackSource =
      service.assignedVolunteerIds.length > 0
        ? service.assignedVolunteerIds
        : service.assignedVolunteerNames;

    return fallbackSource.map((_, index) => ({
      volunteerId: service.assignedVolunteerIds[index] ?? `${index}`,
      name: service.assignedVolunteerNames[index]?.trim(),
      roleLabel: index === 0 ? "Autista" : "Accompagnatore",
    }));
  }, [service]);
  const [actionsAnchorEl, setActionsAnchorEl] = useState<HTMLElement | null>(
    null,
  );

  const availableActions = useMemo(
    () => [
      {
        key: "accept",
        label: "Accetta",
        enabled: canAccept,
        run: onAccept,
        icon: <CheckCircleOutline fontSize="small" />,
      },
      {
        key: "assign",
        label: "Assegna risorse",
        enabled: canAssign,
        run: onAssign,
        icon: <GroupAdd fontSize="small" />,
      },
      {
        key: "start",
        label: "Avvia",
        enabled: canStart,
        run: onStart,
        icon: <PlayArrow fontSize="small" />,
      },
      {
        key: "complete",
        label: "Completa",
        enabled: canComplete,
        run: onComplete,
        icon: <FlagCircle fontSize="small" />,
      },
      {
        key: "cancel",
        label: "Annulla servizio",
        enabled: canCancel,
        run: onCancelService,
        danger: true,
        icon: <DeleteOutline fontSize="small" />,
      },
    ],
    [
      canAccept,
      canAssign,
      canCancel,
      canComplete,
      canStart,
      onAccept,
      onAssign,
      onCancelService,
      onComplete,
      onStart,
    ],
  );
  const actionableItems = availableActions.filter((action) => action.enabled);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <div className="h-full w-[min(100vw,680px)] overflow-y-auto bg-[#fffdfa] p-6">
        <Stack spacing={2.5}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Typography variant="sectionEyebrow">
                Dettaglio servizio
              </Typography>
              <Typography variant="sectionTitle">
                {service?.clientDisplayName || service?.clientId || "Servizio"}
              </Typography>
            </div>
            <IconButton onClick={onClose} sx={workspaceDetailCloseButtonSx}>
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </div>

          {isLoading ? (
            <LoadingState message="Caricamento dettaglio servizio..." />
          ) : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
          {actionErrorMessage ? (
            <Alert severity="warning">{actionErrorMessage}</Alert>
          ) : null}

          {service ? (
            <>
              <ContentCard className="bg-white p-5">
                <Stack spacing={1.5}>
                  <Typography variant="sectionEyebrow">Azioni</Typography>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      sx={workspacePrimaryActionButtonSx}
                      disabled={isActionSubmitting || !canEdit}
                      onClick={onEdit}
                    >
                      Modifica
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutline />}
                      disabled={isActionSubmitting || !canDelete}
                      onClick={onDelete}
                    >
                      Elimina
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<EventRepeat />}
                      sx={workspacePrimaryActionButtonSx}
                      disabled={!canReschedule || isActionSubmitting}
                      onClick={onReschedule}
                    >
                      Ripianifica
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PublishedWithChanges />}
                      sx={workspacePrimaryActionButtonSx}
                      disabled={
                        actionableItems.length === 0 || isActionSubmitting
                      }
                      onClick={(event) => {
                        setActionsAnchorEl(event.currentTarget);
                      }}
                    >
                      Cambia stato
                    </Button>
                    <Menu
                      anchorEl={actionsAnchorEl}
                      open={Boolean(actionsAnchorEl)}
                      PaperProps={{
                        sx: {
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          boxShadow: "0 10px 30px rgba(8,19,31,0.12)",
                          minWidth: 220,
                        },
                      }}
                      onClose={() => setActionsAnchorEl(null)}
                    >
                      {actionableItems.map((action) => (
                        <MenuItem
                          key={action.key}
                          onClick={() => {
                            setActionsAnchorEl(null);
                            action.run();
                          }}
                          sx={
                            action.danger ? { color: "error.main" } : undefined
                          }
                        >
                          <ListItemIcon
                            sx={
                              action.danger
                                ? { color: "error.main" }
                                : undefined
                            }
                          >
                            {action.icon}
                          </ListItemIcon>
                          <ListItemText primary={action.label} />
                        </MenuItem>
                      ))}
                    </Menu>
                    {canSelfAssign ? (
                      <Button
                        variant="contained"
                        sx={workspacePrimaryActionButtonSx}
                        disabled={isActionSubmitting}
                        onClick={onSelfAssign}
                      >
                        Assegna me stesso
                      </Button>
                    ) : null}
                    {canSelfRemove ? (
                      <Button
                        variant="outlined"
                        color="error"
                        disabled={isActionSubmitting}
                        onClick={onSelfRemove}
                      >
                        Rimuovi me stesso
                      </Button>
                    ) : null}
                    {canAssignVehicle ? (
                      <Button
                        variant="outlined"
                        sx={workspacePrimaryActionButtonSx}
                        disabled={isActionSubmitting}
                        onClick={onAssignVehicle}
                      >
                        Assegna/Cambia veicolo
                      </Button>
                    ) : null}
                    {canRemoveVehicle ? (
                      <Button
                        variant="outlined"
                        color={canOverrideRemoveVehicle ? "error" : "inherit"}
                        disabled={isActionSubmitting}
                        onClick={onRemoveVehicle}
                      >
                        Rimuovi veicolo
                      </Button>
                    ) : null}
                  </div>
                </Stack>
              </ContentCard>

              <ContentCard className="bg-white p-5">
                <Accordion disableGutters elevation={0} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="sectionEyebrow">
                      Dati servizio
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0 }}>
                    <div className="overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[#f7f9fc]">
                      <div className="grid grid-cols-[170px,1fr] items-start gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Stato
                        </Typography>
                        <Chip
                          size="small"
                          label={getTransportStatusLabel(service.status)}
                          sx={{
                            width: "fit-content",
                            fontWeight: 700,
                            ...getTransportStatusChipSx(service.status),
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-[170px,1fr] items-start gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
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
                      <div className="grid grid-cols-[170px,1fr] items-start gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
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
                      <div className="grid grid-cols-[170px,1fr] items-start gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
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
                      <div className="grid grid-cols-[170px,1fr] items-start gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
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
                      <div className="grid grid-cols-[170px,1fr] items-start gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
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
                      <div className="grid grid-cols-[170px,1fr] items-start gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Veicolo
                        </Typography>
                        <Typography
                          variant="bodyMedium"
                          sx={{ fontWeight: 500 }}
                        >
                          {service.vehicleDisplayName ||
                            service.vehicleId ||
                            "-"}
                        </Typography>
                      </div>
                      <div className="grid grid-cols-[170px,1fr] items-start gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                        <Typography
                          variant="bodySmall"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          Pianificato per
                        </Typography>
                        <Typography
                          variant="bodyMedium"
                          sx={{ fontWeight: 500 }}
                        >
                          {formatPlannedWindow(
                            service.scheduledAt,
                            service.scheduledEnd,
                          )}
                        </Typography>
                      </div>
                      <div className="grid grid-cols-[170px,1fr] items-start gap-4 px-4 py-3">
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

              <ContentCard className="bg-white p-5">
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
                            className={`grid grid-cols-[170px,1fr] items-start gap-4 px-4 py-3 ${
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

              <ContentCard className="bg-white p-5">
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
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  disabled={isActionSubmitting}
                                  onClick={() =>
                                    onRemoveVolunteer(volunteer.volunteerId)
                                  }
                                >
                                  Rimuovi
                                </Button>
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
