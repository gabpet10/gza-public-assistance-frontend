"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import {
  AccessibilityNew,
  AssignmentInd,
  Diversity3,
  Healing,
  LocalHospital,
  LocalShipping,
  MedicalInformation,
  SwapHoriz,
} from "@mui/icons-material";
import dayjs, { type Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { getErrorMessage } from "@/core/api/errors";
import type {
  TransportAssignmentRole,
  TransportServiceStatus,
  TransportServiceFormData,
  TransportType,
} from "@/features/transport-services/api/types";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";
import {
  EntityLookupDialogField,
  type LookupOption,
  type LookupSearchInput,
  type LookupSearchResult,
} from "@/shared/ui/entity-lookup-dialog-field";
import {
  getTransportTypeLabel,
  getTransportStatusChipSx,
  getTransportStatusLabel,
} from "@/features/transport-services/components/transport-service-status-ui";

type TransportServiceFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: TransportServiceFormData;
  organizationId?: string;
  onSearchClients: (
    input: LookupSearchInput,
    organizationId: string,
  ) => Promise<LookupSearchResult>;
  onSearchDestinations: (
    input: LookupSearchInput,
    organizationId: string,
  ) => Promise<LookupSearchResult>;
  onSearchVehicles: (
    input: LookupSearchInput,
    organizationId: string,
  ) => Promise<LookupSearchResult>;
  onSearchVolunteers: (
    input: LookupSearchInput,
    organizationId: string,
  ) => Promise<LookupSearchResult>;
  onClose: () => void;
  onSubmit: (values: TransportServiceFormData) => Promise<void>;
};

const transportTypeOptions: TransportType[] = [
  "sanitario",
  "sociale",
  "dimissione_ospedaliera",
  "visita_programmata",
  "dialisi",
  "riabilitazione",
  "trasferimento_struttura",
  "accompagnamento_amministrativo",
];

function getTransportTypeIcon(transportType: TransportType) {
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

const emptyTransportServiceForm: TransportServiceFormData = {
  clientId: "",
  clientLabel: "",
  pickupDestinationId: "",
  pickupDestinationLabel: "",
  pickupDestinationDescription: "",
  transportType: "sociale",
  scheduledAt: new Date().toISOString(),
  scheduledEnd: null,
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

function toDateTimeValue(isoValue: string): Dayjs | null {
  if (!isoValue) {
    return null;
  }

  const value = dayjs(isoValue);
  if (!value.isValid()) {
    return null;
  }

  return value;
}

function toIsoValue(value: Dayjs | null) {
  if (!value || !value.isValid()) {
    return "";
  }

  return value.toDate().toISOString();
}

function getClientPrelievoData(option: LookupOption | undefined) {
  const address = option?.data?.address?.trim() || "";
  const city = option?.data?.city?.trim() || "";
  const province = option?.data?.province?.trim() || "";

  if (address || city || province) {
    return { address, city, province };
  }

  const [descriptionAddress, descriptionCity, descriptionProvince] = (
    option?.description ?? ""
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    address: descriptionAddress ?? "",
    city: descriptionCity ?? "",
    province: descriptionProvince ?? "",
  };
}

function getDestinationDescription(option: LookupOption | undefined) {
  const description = option?.description?.trim() ?? "";
  if (description) {
    return description;
  }

  return [option?.data?.address, option?.data?.city, option?.data?.province]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(", ");
}

const wizardSteps = [
  "Cliente e destinazione",
  "Pianificazione e note",
  "Risorse",
] as const;

const editableServiceStatuses: TransportServiceStatus[] = [
  "pending",
  "accepted",
];

const wizardStepMinHeightSx = {
  minHeight: { xs: 320, md: 340 },
};

function normalizeInitialValues(
  values: TransportServiceFormData | undefined,
): TransportServiceFormData {
  if (!values) {
    return emptyTransportServiceForm;
  }

  return {
    ...values,
    pickupDestinationDescription: values.pickupDestinationDescription ?? "",
    scheduledEnd: values.scheduledEnd ?? null,
    serviceStatus: values.serviceStatus ?? "pending",
    volunteerRoles: values.volunteerIds.map(
      (_, index) =>
        values.volunteerRoles[index] ?? (index === 0 ? "driver" : "attendant"),
    ),
  };
}

function validateResources(): string | null {
  return null;
}

function shouldClearAssignedVolunteers(status: TransportServiceStatus) {
  return status === "pending" || status === "accepted";
}

export function TransportServiceFormDialog({
  open,
  mode,
  initialValues,
  organizationId,
  onSearchClients,
  onSearchDestinations,
  onSearchVehicles,
  onSearchVolunteers,
  onClose,
  onSubmit,
}: TransportServiceFormDialogProps) {
  const [formValues, setFormValues] = useState<TransportServiceFormData>(
    normalizeInitialValues(initialValues),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(normalizeInitialValues(initialValues));
    setIsSubmitting(false);
    setSubmitError(null);
    setActiveStep(0);
  }, [initialValues, open]);

  const currentStatus = useMemo<TransportServiceStatus>(() => {
    return formValues.serviceStatus;
  }, [formValues.serviceStatus]);

  const canEditStatus =
    currentStatus !== "completed" && currentStatus !== "cancelled";

  const title = useMemo(
    () => (mode === "create" ? "Nuovo servizio" : "Modifica servizio"),
    [mode],
  );

  const validateStep = (step: number): string | null => {
    if (!organizationId) {
      return "Contesto organizzazione non disponibile.";
    }

    if (step === 0) {
      if (!formValues.clientId.trim()) {
        return "Seleziona un cliente.";
      }

      if (!formValues.pickupDestinationId.trim()) {
        return "Seleziona una destinazione servizio.";
      }

      if (!formValues.dropoffAddress.trim()) {
        return "Inserisci l'indirizzo di prelievo.";
      }

      if (!formValues.dropoffCity.trim()) {
        return "Inserisci la citta di prelievo.";
      }

      if (!formValues.dropoffProvince.trim()) {
        return "Inserisci la provincia di prelievo.";
      }
    }

    if (step === 1) {
      const scheduledDate = new Date(formValues.scheduledAt);
      if (Number.isNaN(scheduledDate.getTime())) {
        return "Inserisci data e ora pianificate valide.";
      }

      if (scheduledDate.getTime() < Date.now()) {
        return "La data/ora di inizio non puo essere nel passato.";
      }

      if (formValues.scheduledEnd) {
        const scheduledEndDate = new Date(formValues.scheduledEnd);
        if (Number.isNaN(scheduledEndDate.getTime())) {
          return "Inserisci una data e ora fine valide.";
        }

        if (scheduledEndDate.getTime() <= scheduledDate.getTime()) {
          return "La data/ora di fine deve essere successiva alla data/ora di inizio.";
        }
      }

      if (formValues.isPaid) {
        if (formValues.amount === null || Number.isNaN(formValues.amount)) {
          return "Inserisci un importo valido per i servizi a pagamento.";
        }

        if (formValues.amount <= 0) {
          return "L'importo deve essere maggiore di zero.";
        }
      }
    }

    if (step === 2) {
      return validateResources();
    }

    return null;
  };

  const handleNextStep = () => {
    const validation = validateStep(activeStep);
    if (validation) {
      setSubmitError(validation);
      return;
    }

    setSubmitError(null);
    setActiveStep((current) => Math.min(current + 1, wizardSteps.length - 1));
  };

  const handlePreviousStep = () => {
    setSubmitError(null);
    setActiveStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    for (let stepIndex = 0; stepIndex < wizardSteps.length; stepIndex += 1) {
      const validation = validateStep(stepIndex);
      if (validation) {
        setActiveStep(stepIndex);
        setSubmitError(validation);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formValues);
      onClose();
    } catch (error) {
      setSubmitError(
        getErrorMessage(error, "Salvataggio servizio non riuscito."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          minHeight: { xs: 660, md: 700 },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1.25 }}>
          <FeatureDialogTitle
            icon={<LocalShipping sx={{ fontSize: 20 }} />}
            eyebrow={title}
          />
        </DialogTitle>
        <DialogContent
          sx={{
            ...formDialogContentSx,
            minHeight: { xs: 500, md: 530 },
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stepper
                activeStep={activeStep}
                alternativeLabel
                sx={{
                  mb: 0.5,
                  "& .MuiStepLabel-label": {
                    fontSize: "0.78rem",
                  },
                  "& .MuiStepIcon-root": {
                    fontSize: "1.15rem",
                  },
                }}
              >
                {wizardSteps.map((step) => (
                  <Step key={step}>
                    <StepLabel>{step}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {submitError ? (
                <Alert severity="error">{submitError}</Alert>
              ) : null}

              {activeStep === 0 ? (
                <Stack spacing={2} sx={wizardStepMinHeightSx}>
                  <Divider />
                  <Typography variant="sectionEyebrow" sx={{ fontSize: 11 }}>
                    Cliente
                  </Typography>
                  <EntityLookupDialogField
                    label="Cliente"
                    dialogTitle="Seleziona cliente"
                    value={formValues.clientId ? [formValues.clientId] : []}
                    selectedOptions={
                      formValues.clientId
                        ? [
                            {
                              id: formValues.clientId,
                              label:
                                formValues.clientLabel || "Cliente selezionato",
                            },
                          ]
                        : []
                    }
                    required
                    triggerAriaLabel="Apri ricerca cliente"
                    disabled={isSubmitting || !organizationId}
                    onSearch={(input) =>
                      organizationId
                        ? onSearchClients(input, organizationId)
                        : Promise.resolve({ items: [], hasNextPage: false })
                    }
                    onChange={(ids, options) => {
                      const selected = options[0];
                      const prelievoData = getClientPrelievoData(selected);

                      setFormValues((current) => ({
                        ...current,
                        clientId: ids[0] ?? "",
                        clientLabel: selected?.label ?? "",
                        dropoffAddress:
                          current.dropoffAddress.trim() || !prelievoData.address
                            ? current.dropoffAddress
                            : prelievoData.address,
                        dropoffCity:
                          current.dropoffCity.trim() || !prelievoData.city
                            ? current.dropoffCity
                            : prelievoData.city,
                        dropoffProvince:
                          current.dropoffProvince.trim() ||
                          !prelievoData.province
                            ? current.dropoffProvince
                            : prelievoData.province,
                      }));
                    }}
                  />
                  <TextField
                    label="Indirizzo"
                    value={formValues.dropoffAddress}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        dropoffAddress: event.target.value,
                      }))
                    }
                    disabled={isSubmitting}
                    required
                  />

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                    <TextField
                      label="Citta"
                      value={formValues.dropoffCity}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          dropoffCity: event.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Provincia"
                      value={formValues.dropoffProvince}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          dropoffProvince: event.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                      required
                      fullWidth
                    />
                  </Stack>

                  <Divider />
                  <Typography variant="sectionEyebrow" sx={{ fontSize: 11 }}>
                    Destinazione
                  </Typography>
                  <EntityLookupDialogField
                    label="Destinazione servizio"
                    dialogTitle="Seleziona destinazione"
                    value={
                      formValues.pickupDestinationId
                        ? [formValues.pickupDestinationId]
                        : []
                    }
                    selectedOptions={
                      formValues.pickupDestinationId
                        ? [
                            {
                              id: formValues.pickupDestinationId,
                              label:
                                formValues.pickupDestinationLabel ||
                                "Destinazione selezionata",
                              description:
                                formValues.pickupDestinationDescription ||
                                undefined,
                            },
                          ]
                        : []
                    }
                    required
                    triggerAriaLabel="Apri ricerca destinazione"
                    disabled={isSubmitting || !organizationId}
                    onSearch={(input) =>
                      organizationId
                        ? onSearchDestinations(input, organizationId)
                        : Promise.resolve({ items: [], hasNextPage: false })
                    }
                    onChange={(ids, options) => {
                      const selected = options[0];
                      setFormValues((current) => ({
                        ...current,
                        pickupDestinationId: ids[0] ?? "",
                        pickupDestinationLabel: selected?.label ?? "",
                        pickupDestinationDescription: ids[0]
                          ? getDestinationDescription(selected)
                          : "",
                      }));
                    }}
                  />
                </Stack>
              ) : null}

              {activeStep === 1 ? (
                <Stack spacing={2} sx={wizardStepMinHeightSx}>
                  <Divider />
                  <Typography variant="sectionEyebrow" sx={{ fontSize: 11 }}>
                    Pianificazione
                  </Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                    <DateTimePicker
                      label="Data inizio e ora"
                      value={toDateTimeValue(formValues.scheduledAt)}
                      onChange={(value) =>
                        setFormValues((current) => ({
                          ...current,
                          scheduledAt: toIsoValue(value),
                        }))
                      }
                      ampm={false}
                      slotProps={{
                        textField: {
                          required: true,
                          disabled: isSubmitting,
                          fullWidth: true,
                        },
                      }}
                    />

                    <DateTimePicker
                      label="Data fine e ora"
                      value={toDateTimeValue(formValues.scheduledEnd ?? "")}
                      onChange={(value) =>
                        setFormValues((current) => ({
                          ...current,
                          scheduledEnd:
                            value && value.isValid()
                              ? value.toDate().toISOString()
                              : null,
                        }))
                      }
                      ampm={false}
                      slotProps={{
                        textField: {
                          disabled: isSubmitting,
                          fullWidth: true,
                          helperText: "Opzionale",
                        },
                      }}
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                    <TextField
                      select
                      fullWidth
                      label="Tipologia trasporto"
                      value={formValues.transportType}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          transportType: event.target.value as TransportType,
                        }))
                      }
                      disabled={isSubmitting}
                    >
                      {transportTypeOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                          >
                            {getTransportTypeIcon(option)}
                            <span>{getTransportTypeLabel(option)}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </TextField>

                    {mode === "create" ? (
                      <TextField
                        select
                        fullWidth
                        label="Stato iniziale"
                        value={formValues.serviceStatus}
                        onChange={(event) => {
                          const nextStatus = event.target
                            .value as TransportServiceStatus;

                          setFormValues((current) => {
                            if (shouldClearAssignedVolunteers(nextStatus)) {
                              return {
                                ...current,
                                serviceStatus: nextStatus,
                                volunteerIds: [],
                                volunteerLabels: [],
                                volunteerRoles: [],
                              };
                            }

                            return {
                              ...current,
                              serviceStatus: nextStatus,
                            };
                          });
                        }}
                        disabled={isSubmitting}
                      >
                        {editableServiceStatuses.map((status) => (
                          <MenuItem key={status} value={status}>
                            {getTransportStatusLabel(status)}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : canEditStatus ? (
                      <TextField
                        select
                        fullWidth
                        label="Stato servizio"
                        value={formValues.serviceStatus}
                        onChange={(event) => {
                          const nextStatus = event.target
                            .value as TransportServiceStatus;

                          setFormValues((current) => {
                            if (!canEditStatus) {
                              return current;
                            }

                            if (shouldClearAssignedVolunteers(nextStatus)) {
                              return {
                                ...current,
                                serviceStatus: nextStatus,
                                volunteerIds: [],
                                volunteerLabels: [],
                                volunteerRoles: [],
                              };
                            }

                            return {
                              ...current,
                              serviceStatus: nextStatus,
                            };
                          });
                        }}
                        disabled={isSubmitting || !canEditStatus}
                      >
                        {editableServiceStatuses.map((status) => (
                          <MenuItem key={status} value={status}>
                            {getTransportStatusLabel(status)}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <Stack
                        spacing={0.75}
                        sx={{ minWidth: { md: 220 }, justifyContent: "center" }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Stato servizio
                        </Typography>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={getTransportStatusLabel(currentStatus)}
                          sx={{
                            width: "fit-content",
                            ...getTransportStatusChipSx(currentStatus),
                          }}
                        />
                      </Stack>
                    )}
                  </Stack>

                  <Divider />
                  <Typography variant="sectionEyebrow" sx={{ fontSize: 11 }}>
                    Pagamento
                  </Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                    <TextField
                      select
                      fullWidth
                      label="Tipo servizio"
                      value={formValues.isPaid ? "paid" : "free"}
                      onChange={(event) => {
                        const isPaidService = event.target.value === "paid";
                        setFormValues((current) => ({
                          ...current,
                          isPaid: isPaidService,
                          amount: isPaidService ? current.amount : null,
                        }));
                      }}
                      disabled={isSubmitting}
                    >
                      <MenuItem value="free">Non a pagamento</MenuItem>
                      <MenuItem value="paid">A pagamento</MenuItem>
                    </TextField>

                    <TextField
                      fullWidth
                      label="Importo (EUR)"
                      type="number"
                      value={formValues.amount ?? ""}
                      onChange={(event) => {
                        const parsed = Number(event.target.value);
                        setFormValues((current) => ({
                          ...current,
                          amount:
                            event.target.value === "" || Number.isNaN(parsed)
                              ? null
                              : parsed,
                        }));
                      }}
                      inputProps={{ min: 0.01, step: 0.01 }}
                      disabled={isSubmitting || !formValues.isPaid}
                      required={formValues.isPaid}
                    />
                  </Stack>

                  <Divider />
                  <TextField
                    label="Note"
                    value={formValues.note}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    multiline
                    minRows={3}
                    disabled={isSubmitting}
                  />
                </Stack>
              ) : null}

              {activeStep === 2 ? (
                <Stack spacing={2} sx={wizardStepMinHeightSx}>
                  <Divider />
                  <Typography variant="sectionEyebrow" sx={{ fontSize: 11 }}>
                    Risorse
                  </Typography>
                  <EntityLookupDialogField
                    label="Veicolo"
                    dialogTitle="Seleziona veicolo"
                    value={formValues.vehicleId ? [formValues.vehicleId] : []}
                    selectedOptions={
                      formValues.vehicleId
                        ? [
                            {
                              id: formValues.vehicleId,
                              label:
                                formValues.vehicleLabel ||
                                "Veicolo selezionato",
                              description:
                                formValues.vehicleSecondaryLabel || undefined,
                            },
                          ]
                        : []
                    }
                    triggerAriaLabel="Apri ricerca veicolo"
                    disabled={isSubmitting || !organizationId}
                    onSearch={(input) =>
                      organizationId
                        ? onSearchVehicles(input, organizationId)
                        : Promise.resolve({ items: [], hasNextPage: false })
                    }
                    onChange={(ids, options) => {
                      const selected = options[0];
                      setFormValues((current) => ({
                        ...current,
                        vehicleId: ids[0] ?? "",
                        vehicleLabel: selected?.label ?? "",
                        vehicleSecondaryLabel: selected?.description ?? "",
                      }));
                    }}
                  />

                  <EntityLookupDialogField
                    label="Volontari"
                    dialogTitle="Seleziona volontari"
                    value={formValues.volunteerIds}
                    selectedOptions={formValues.volunteerIds.map(
                      (id, index) => ({
                        id,
                        label:
                          formValues.volunteerLabels[index] ??
                          "Nome non disponibile",
                      }),
                    )}
                    multiple
                    triggerAriaLabel="Apri ricerca volontari"
                    disabled={isSubmitting || !organizationId}
                    onSearch={(input) =>
                      organizationId
                        ? onSearchVolunteers(input, organizationId)
                        : Promise.resolve({ items: [], hasNextPage: false })
                    }
                    onChange={(ids, options) => {
                      setFormValues((current) => ({
                        ...current,
                        volunteerIds: ids,
                        volunteerLabels: options.map((option) => option.label),
                        volunteerRoles: ids.map((id, index) => {
                          const currentIndex = current.volunteerIds.indexOf(id);
                          if (currentIndex >= 0) {
                            return (
                              current.volunteerRoles[currentIndex] ??
                              (index === 0 ? "driver" : "attendant")
                            );
                          }

                          return index === 0 ? "driver" : "attendant";
                        }),
                      }));
                    }}
                  />

                  <Stack spacing={1}>
                    <Typography variant="sectionEyebrow" sx={{ fontSize: 11 }}>
                      Ruolo per volontario
                    </Typography>
                    {formValues.volunteerIds.length ? (
                      formValues.volunteerIds.map((volunteerId, index) => (
                        <Stack
                          key={volunteerId}
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.25}
                        >
                          <TextField
                            label="Volontario"
                            value={
                              formValues.volunteerLabels[index] ??
                              "Nome non disponibile"
                            }
                            disabled
                            fullWidth
                          />
                          <TextField
                            select
                            label="Ruolo"
                            value={
                              formValues.volunteerRoles[index] ??
                              (index === 0 ? "driver" : "attendant")
                            }
                            onChange={(event) => {
                              const nextRole = event.target
                                .value as TransportAssignmentRole;
                              setFormValues((current) => ({
                                ...current,
                                volunteerRoles: current.volunteerIds.map(
                                  (_, roleIndex) =>
                                    roleIndex === index
                                      ? nextRole
                                      : (current.volunteerRoles[roleIndex] ??
                                        (roleIndex === 0
                                          ? "driver"
                                          : "attendant")),
                                ),
                              }));
                            }}
                            fullWidth
                          >
                            <MenuItem value="driver">Autista</MenuItem>
                            <MenuItem value="attendant">
                              Accompagnatore
                            </MenuItem>
                          </TextField>
                        </Stack>
                      ))
                    ) : (
                      <Typography variant="bodySmall" color="text.secondary">
                        Nessun volontario selezionato. Puoi salvare anche solo
                        il veicolo.
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              ) : null}
            </Stack>
          </LocalizationProvider>
        </DialogContent>

        <DialogActions sx={formDialogActionsEndSx}>
          <Button
            onClick={onClose}
            variant="outlined"
            color="error"
            disabled={isSubmitting}
          >
            Annulla
          </Button>
          {activeStep > 0 ? (
            <Button
              type="button"
              variant="outlined"
              onClick={handlePreviousStep}
              disabled={isSubmitting}
            >
              Indietro
            </Button>
          ) : null}
          {activeStep < wizardSteps.length - 1 ? (
            <Button
              type="button"
              variant="contained"
              sx={formDialogPrimaryActionSx}
              onClick={handleNextStep}
              disabled={isSubmitting}
            >
              Avanti
            </Button>
          ) : null}
          <Button
            type="submit"
            variant="contained"
            sx={formDialogPrimaryActionSx}
            disabled={isSubmitting || activeStep < wizardSteps.length - 1}
          >
            {isSubmitting
              ? "Salvataggio..."
              : mode === "create"
                ? "Crea servizio"
                : "Salva modifiche"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
