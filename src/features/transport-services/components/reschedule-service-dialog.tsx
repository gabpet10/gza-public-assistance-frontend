"use client";

import { useEffect, useState } from "react";
import { EventRepeat } from "@mui/icons-material";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";

type RescheduleServiceDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  initialScheduledAt: string;
  initialScheduledEnd: string;
  onClose: () => void;
  onSubmit: (
    scheduledAt: string,
    scheduledEnd: string | null,
  ) => Promise<boolean>;
};

export function RescheduleServiceDialog({
  open,
  isSubmitting,
  initialScheduledAt,
  initialScheduledEnd,
  onClose,
  onSubmit,
}: RescheduleServiceDialogProps) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setScheduledAt(initialScheduledAt);
    setScheduledEnd(initialScheduledEnd);
    setSubmitError(null);
  }, [initialScheduledAt, initialScheduledEnd, open]);

  const handleSubmit = async () => {
    if (!scheduledAt) {
      setSubmitError("Seleziona una data valida.");
      return;
    }

    if (scheduledEnd) {
      const parsedStart = new Date(scheduledAt).getTime();
      const parsedEnd = new Date(scheduledEnd).getTime();

      if (Number.isNaN(parsedStart) || Number.isNaN(parsedEnd)) {
        setSubmitError("Inserisci data e ora valide.");
        return;
      }

      if (parsedEnd <= parsedStart) {
        setSubmitError(
          "La data/ora di fine deve essere successiva alla data/ora di inizio.",
        );
        return;
      }
    }

    setSubmitError(null);
    const didReschedule = await onSubmit(scheduledAt, scheduledEnd || null);
    if (didReschedule) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
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
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <DateTimePicker
              label="Nuova data e ora inizio"
              value={scheduledAt ? dayjs(scheduledAt) : null}
              onChange={(value) =>
                setScheduledAt(
                  value && value.isValid() ? value.toDate().toISOString() : "",
                )
              }
              ampm={false}
              slotProps={{
                textField: {
                  required: true,
                  disabled: isSubmitting,
                },
              }}
            />

            <DateTimePicker
              label="Nuova data e ora fine"
              value={scheduledEnd ? dayjs(scheduledEnd) : null}
              onChange={(value) =>
                setScheduledEnd(
                  value && value.isValid() ? value.toDate().toISOString() : "",
                )
              }
              ampm={false}
              slotProps={{
                textField: {
                  disabled: isSubmitting,
                  helperText: "Opzionale",
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
          disabled={isSubmitting}
          onClick={onClose}
        >
          Annulla
        </Button>
        <Button
          variant="contained"
          sx={formDialogPrimaryActionSx}
          disabled={isSubmitting}
          onClick={() => {
            void handleSubmit();
          }}
        >
          {isSubmitting ? "Salvataggio..." : "Conferma"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
