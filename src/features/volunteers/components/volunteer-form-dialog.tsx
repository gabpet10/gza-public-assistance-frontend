"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { VolunteerActivism } from "@mui/icons-material";
import { getProblemMessage } from "@/core/api/errors";
import type { VolunteerFormData } from "@/features/volunteers/api/types";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";

const emptyVolunteerForm: VolunteerFormData = {
  organizationId: "",
  firstName: "",
  lastName: "",
  phone: "",
  fiscalCode: "",
  isActive: true,
};

type VolunteerFormDialogProps = Readonly<{
  open: boolean;
  mode: "create" | "edit";
  initialValues?: VolunteerFormData;
  onClose: () => void;
  onSubmit: (values: VolunteerFormData) => Promise<void>;
}>;

export function VolunteerFormDialog({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
}: VolunteerFormDialogProps) {
  const [formValues, setFormValues] = useState<VolunteerFormData>(
    initialValues ?? emptyVolunteerForm,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(initialValues ?? emptyVolunteerForm);
    setSubmitError(null);
  }, [initialValues, open]);

  const title = useMemo(
    () => (mode === "create" ? "Nuovo volontario" : "Modifica volontario"),
    [mode],
  );

  const handleFieldChange = <T extends keyof VolunteerFormData>(
    field: T,
    value: VolunteerFormData[T],
  ) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formValues);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? getProblemMessage((error as { problem?: never }).problem)
          : "Salvataggio non riuscito.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1.25 }}>
          <FeatureDialogTitle
            icon={<VolunteerActivism sx={{ fontSize: 20 }} />}
            eyebrow={title}
          />
        </DialogTitle>
        <DialogContent sx={formDialogContentSx}>
          <Stack spacing={2.5} sx={{ pt: 1.5 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            <TextField
              label="Nome"
              value={formValues.firstName}
              onChange={(event) =>
                handleFieldChange("firstName", event.target.value)
              }
              required
            />
            <TextField
              label="Cognome"
              value={formValues.lastName}
              onChange={(event) =>
                handleFieldChange("lastName", event.target.value)
              }
              required
            />
            <TextField
              label="Telefono"
              value={formValues.phone}
              onChange={(event) =>
                handleFieldChange("phone", event.target.value)
              }
              required
            />
            <TextField
              label="Codice fiscale"
              value={formValues.fiscalCode}
              onChange={(event) =>
                handleFieldChange(
                  "fiscalCode",
                  event.target.value.toUpperCase(),
                )
              }
              required
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formValues.isActive}
                  onChange={(event) =>
                    handleFieldChange("isActive", event.target.checked)
                  }
                />
              }
              label="Volunteer attivo"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={formDialogActionsEndSx}>
          <Button onClick={onClose} variant="outlined" color="error">
            Annulla
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={formDialogPrimaryActionSx}
          >
            {isSubmitting
              ? "Salvataggio..."
              : mode === "create"
                ? "Crea volontario"
                : "Salva modifiche"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
