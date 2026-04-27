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
import { Group } from "@mui/icons-material";
import { getProblemMessage } from "@/core/api/errors";
import type { UserFormData } from "@/features/users/api/types";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";

const emptyUserForm: UserFormData = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  isActive: true,
};

type UserFormDialogProps = Readonly<{
  open: boolean;
  mode: "create" | "edit";
  initialValues?: UserFormData;
  onClose: () => void;
  onSubmit: (values: UserFormData) => Promise<void>;
}>;

export function UserFormDialog({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
}: UserFormDialogProps) {
  const [formValues, setFormValues] = useState<UserFormData>(
    initialValues ?? emptyUserForm,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(initialValues ?? emptyUserForm);
    setSubmitError(null);
  }, [initialValues, open]);

  const title = useMemo(
    () => (mode === "create" ? "Nuovo user" : "Modifica user"),
    [mode],
  );

  const handleFieldChange = <T extends keyof UserFormData>(
    field: T,
    value: UserFormData[T],
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
            icon={<Group sx={{ fontSize: 20 }} />}
            eyebrow={title}
          />
        </DialogTitle>
        <DialogContent sx={formDialogContentSx}>
          <Stack spacing={2.5} sx={{ pt: 1.5 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            <TextField
              label="Email"
              type="email"
              value={formValues.email}
              onChange={(event) =>
                handleFieldChange("email", event.target.value)
              }
              required
            />
            <TextField
              label={mode === "create" ? "Password" : "Nuova password"}
              type="password"
              value={formValues.password}
              onChange={(event) =>
                handleFieldChange("password", event.target.value)
              }
              required={mode === "create"}
              helperText={
                mode === "edit"
                  ? "Lascia vuoto per non cambiare la password."
                  : undefined
              }
            />
            <TextField
              label="Nome"
              value={formValues.firstName}
              onChange={(event) =>
                handleFieldChange("firstName", event.target.value)
              }
            />
            <TextField
              label="Cognome"
              value={formValues.lastName}
              onChange={(event) =>
                handleFieldChange("lastName", event.target.value)
              }
            />
            <TextField
              label="Telefono"
              value={formValues.phone}
              onChange={(event) =>
                handleFieldChange("phone", event.target.value)
              }
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
              label="User attivo"
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
                ? "Crea user"
                : "Salva modifiche"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
