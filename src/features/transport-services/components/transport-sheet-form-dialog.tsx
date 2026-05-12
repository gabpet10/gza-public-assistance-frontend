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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Description } from "@mui/icons-material";
import type { TransportSheetFormData } from "@/features/transport-services/api/transport-sheets-types";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";

const emptyTransportSheetForm: TransportSheetFormData = {
  organizationId: "",
  reportDate: "",
  destinationName: "",
  destinationAddress: "",
  destinationCity: "",
  destinationProvince: "",
  destinationNotes: "",
  clientFiscalCode: "",
  clientFirstName: "",
  clientLastName: "",
  clientPhone: "",
  clientAddress: "",
  clientCity: "",
  clientProvince: "",
  clientAslNumber: "",
  clientAslMunicipality: "",
  clientNotes: "",
  vehiclePlate: "",
  startTime: "",
  endTime: "",
  kmDeparture: "",
  kmArrival: "",
  notes: "",
  volunteerIds: [],
  volunteerDisplayNames: [],
};

type TransportSheetFormDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  initialValues?: TransportSheetFormData;
  onClose: () => void;
  onSubmit: (values: TransportSheetFormData) => Promise<void>;
};

function toDateTimeLocalInput(isoValue: string) {
  const trimmed = isoValue.trim();
  if (!trimmed) {
    return "";
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const timezoneOffset = parsed.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(parsed.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 16);
}

function toIsoFromDateTimeLocal(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString();
}

function toKmValidationError(startKm: string, endKm: string) {
  if (!startKm.trim() && !endKm.trim()) {
    return null;
  }

  if (!startKm.trim() || !endKm.trim()) {
    return "Se valorizzi i chilometri devi compilare sia partenza sia arrivo.";
  }

  const parsedStart = Number.parseInt(startKm, 10);
  const parsedEnd = Number.parseInt(endKm, 10);
  if (Number.isNaN(parsedStart) || Number.isNaN(parsedEnd)) {
    return "I chilometri devono essere numeri interi.";
  }

  if (parsedStart < 0 || parsedEnd < 0) {
    return "I chilometri devono essere maggiori o uguali a zero.";
  }

  if (parsedEnd < parsedStart) {
    return "I chilometri di arrivo devono essere maggiori o uguali a quelli di partenza.";
  }

  return null;
}

function toTimeValidationError(startTime: string, endTime: string) {
  if (!startTime.trim() && !endTime.trim()) {
    return null;
  }

  if (!startTime.trim() || !endTime.trim()) {
    return "Se valorizzi gli orari devi compilare sia inizio sia fine.";
  }

  const parsedStart = new Date(startTime).getTime();
  const parsedEnd = new Date(endTime).getTime();
  if (Number.isNaN(parsedStart) || Number.isNaN(parsedEnd)) {
    return "Gli orari inseriti non sono validi.";
  }

  if (parsedEnd < parsedStart) {
    return "L'orario di fine deve essere successivo o uguale all'orario di inizio.";
  }

  return null;
}

export function TransportSheetFormDialog({
  open,
  isSubmitting,
  submitError,
  initialValues,
  onClose,
  onSubmit,
}: TransportSheetFormDialogProps) {
  const [formValues, setFormValues] = useState<TransportSheetFormData>(
    initialValues ?? emptyTransportSheetForm,
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(initialValues ?? emptyTransportSheetForm);
    setLocalError(null);
  }, [initialValues, open]);

  const reportDateLocal = useMemo(
    () => toDateTimeLocalInput(formValues.reportDate),
    [formValues.reportDate],
  );
  const startTimeLocal = useMemo(
    () => toDateTimeLocalInput(formValues.startTime),
    [formValues.startTime],
  );
  const endTimeLocal = useMemo(
    () => toDateTimeLocalInput(formValues.endTime),
    [formValues.endTime],
  );
  const clientMainDisplay = useMemo(() => {
    const fullName = [formValues.clientFirstName, formValues.clientLastName]
      .filter((value) => value.trim())
      .join(" ")
      .trim();

    return fullName || formValues.clientFiscalCode;
  }, [
    formValues.clientFirstName,
    formValues.clientLastName,
    formValues.clientFiscalCode,
  ]);

  const handleFieldChange = <T extends keyof TransportSheetFormData>(
    field: T,
    value: TransportSheetFormData[T],
  ) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const kmError = toKmValidationError(
      formValues.kmDeparture,
      formValues.kmArrival,
    );
    if (kmError) {
      setLocalError(kmError);
      return;
    }

    const timeError = toTimeValidationError(
      formValues.startTime,
      formValues.endTime,
    );
    if (timeError) {
      setLocalError(timeError);
      return;
    }

    setLocalError(null);
    await onSubmit(formValues);
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1.25 }}>
          <FeatureDialogTitle
            icon={<Description sx={{ fontSize: 20 }} />}
            eyebrow="Scheda trasporto"
          />
        </DialogTitle>
        <DialogContent sx={formDialogContentSx}>
          <Stack spacing={2.5} sx={{ pt: 1.5 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            {localError ? <Alert severity="warning">{localError}</Alert> : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
              <TextField
                fullWidth
                label="Numero scheda"
                value={
                  typeof formValues.sheetNumber === "number"
                    ? String(formValues.sheetNumber)
                    : ""
                }
                InputProps={{ readOnly: true }}
              />
              <TextField
                fullWidth
                label="Data scheda"
                type="datetime-local"
                value={reportDateLocal}
                onChange={(event) =>
                  handleFieldChange(
                    "reportDate",
                    toIsoFromDateTimeLocal(event.target.value),
                  )
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Stack>

            <Divider />
            <Typography variant="sectionEyebrow" sx={{ fontSize: 11 }}>
              Destinazione trasporto
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
              <TextField
                fullWidth
                label="Destinazione"
                value={formValues.destinationName}
                InputProps={{ readOnly: true }}
                sx={{
                  "& .MuiInputBase-input": {
                    fontWeight: 700,
                  },
                }}
              />
              <TextField
                fullWidth
                label="Indirizzo destinazione"
                value={formValues.destinationAddress}
                InputProps={{ readOnly: true }}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
              <TextField
                fullWidth
                label="Citta destinazione"
                value={formValues.destinationCity}
                InputProps={{ readOnly: true }}
              />
              <TextField
                fullWidth
                label="Provincia destinazione"
                value={formValues.destinationProvince}
                InputProps={{ readOnly: true }}
              />
            </Stack>

            <Divider />
            <Typography variant="sectionEyebrow" sx={{ fontSize: 11 }}>
              Cliente
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
              <TextField
                fullWidth
                label="Cliente"
                value={clientMainDisplay}
                InputProps={{ readOnly: true }}
                sx={{
                  "& .MuiInputBase-input": {
                    fontWeight: 700,
                  },
                }}
              />
              <TextField
                fullWidth
                label="Codice fiscale cliente"
                value={formValues.clientFiscalCode}
                InputProps={{ readOnly: true }}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
              <TextField
                fullWidth
                label="Telefono"
                value={formValues.clientPhone}
                InputProps={{ readOnly: true }}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
              <TextField
                fullWidth
                label="Nome cliente"
                value={formValues.clientFirstName}
                InputProps={{ readOnly: true }}
              />
              <TextField
                fullWidth
                label="Cognome cliente"
                value={formValues.clientLastName}
                InputProps={{ readOnly: true }}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
              <TextField
                fullWidth
                label="Indirizzo cliente"
                value={formValues.clientAddress}
                InputProps={{ readOnly: true }}
              />
              <TextField
                fullWidth
                label="Citta cliente"
                value={formValues.clientCity}
                InputProps={{ readOnly: true }}
              />
              <TextField
                fullWidth
                label="Provincia cliente"
                value={formValues.clientProvince}
                InputProps={{ readOnly: true }}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
              <TextField
                fullWidth
                label="Numero ASL"
                value={formValues.clientAslNumber}
                InputProps={{ readOnly: true }}
              />
              <TextField
                fullWidth
                label="Comune ASL"
                value={formValues.clientAslMunicipality}
                InputProps={{ readOnly: true }}
              />
            </Stack>

            <Divider />
            <Typography variant="sectionEyebrow" sx={{ fontSize: 11 }}>
              Veicolo e viaggio
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
              <TextField
                fullWidth
                label="Orario inizio"
                type="datetime-local"
                value={startTimeLocal}
                onChange={(event) =>
                  handleFieldChange(
                    "startTime",
                    toIsoFromDateTimeLocal(event.target.value),
                  )
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Orario fine"
                type="datetime-local"
                value={endTimeLocal}
                onChange={(event) =>
                  handleFieldChange(
                    "endTime",
                    toIsoFromDateTimeLocal(event.target.value),
                  )
                }
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
              <TextField
                fullWidth
                label="Targa veicolo"
                value={formValues.vehiclePlate}
                InputProps={{ readOnly: true }}
                sx={{
                  "& .MuiInputBase-input": {
                    fontWeight: 700,
                  },
                }}
              />

              <TextField
                fullWidth
                label="Km partenza"
                value={formValues.kmDeparture}
                onChange={(event) =>
                  handleFieldChange("kmDeparture", event.target.value)
                }
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              />
              <TextField
                fullWidth
                label="Km arrivo"
                value={formValues.kmArrival}
                onChange={(event) =>
                  handleFieldChange("kmArrival", event.target.value)
                }
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              />
            </Stack>

            <Divider />
            <Typography variant="sectionEyebrow" sx={{ fontSize: 11 }}>
              Volontari
            </Typography>
            {(formValues.volunteerDisplayNames?.length ?? 0) > 0 ||
            formValues.volunteerIds.length > 0 ? (
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ flexWrap: "wrap" }}
              >
                {(formValues.volunteerDisplayNames?.length
                  ? formValues.volunteerDisplayNames
                  : formValues.volunteerIds
                ).map((volunteerLabel) => (
                  <Chip
                    key={volunteerLabel}
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={volunteerLabel}
                    sx={{ fontWeight: 600 }}
                  />
                ))}
              </Stack>
            ) : (
              <Alert severity="info">Nessun volontario associato.</Alert>
            )}

            <Divider />
            <Typography variant="sectionEyebrow" sx={{ fontSize: 11 }}>
              Note
            </Typography>
            <TextField
              label="Note scheda"
              value={formValues.notes}
              multiline
              minRows={3}
              InputProps={{ readOnly: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={formDialogActionsEndSx}>
          <Button
            variant="outlined"
            color="error"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annulla
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={formDialogPrimaryActionSx}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvataggio..." : "Salva scheda"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
