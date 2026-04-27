"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { Business } from "@mui/icons-material";
import { toApiUiError } from "@/core/api/errors";
import type { ClientFormData } from "@/features/clients/api/types";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";

const emptyClientForm: ClientFormData = {
  organizationId: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  notes: "",
};

type ClientFormDialogProps = Readonly<{
  open: boolean;
  mode: "create" | "edit";
  initialValues?: ClientFormData;
  onClose: () => void;
  onSubmit: (values: ClientFormData) => Promise<void>;
}>;

export function ClientFormDialog({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
}: ClientFormDialogProps) {
  const [formValues, setFormValues] = useState<ClientFormData>(
    initialValues ?? emptyClientForm,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(initialValues ?? emptyClientForm);
    setSubmitError(null);
  }, [initialValues, open]);

  const title = useMemo(
    () => (mode === "create" ? "Nuovo cliente" : "Modifica cliente"),
    [mode],
  );

  const handleFieldChange = <T extends keyof ClientFormData>(
    field: T,
    value: ClientFormData[T],
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
      const message = toApiUiError(
        error,
        "Salvataggio non riuscito.",
      ).userMessage;
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
            icon={<Business sx={{ fontSize: 20 }} />}
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
            />
            <TextField
              label="Indirizzo"
              value={formValues.address}
              onChange={(event) =>
                handleFieldChange("address", event.target.value)
              }
            />
            <TextField
              label="Citta"
              value={formValues.city}
              onChange={(event) =>
                handleFieldChange("city", event.target.value)
              }
            />
            <TextField
              label="Provincia"
              value={formValues.province}
              onChange={(event) =>
                handleFieldChange("province", event.target.value)
              }
            />
            <TextField
              label="Note"
              value={formValues.notes}
              onChange={(event) =>
                handleFieldChange("notes", event.target.value)
              }
              multiline
              minRows={3}
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
                ? "Crea cliente"
                : "Salva modifiche"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
