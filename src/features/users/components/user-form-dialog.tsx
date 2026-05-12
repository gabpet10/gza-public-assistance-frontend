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
  MenuItem,
  Stack,
  Switch,
  TextField,
  type SvgIconProps,
} from "@mui/material";
import {
  AdminPanelSettings,
  Badge,
  Group,
  VolunteerActivism,
} from "@mui/icons-material";
import { getErrorMessage } from "@/core/api/errors";
import type { UserFormData } from "@/features/users/api/types";
import {
  type UserTypeValue,
  userTypeOptions,
} from "@/features/users/api/types";
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
  isActive: true,
  userType: "operator",
};

type UserFormDialogProps = Readonly<{
  open: boolean;
  mode: "create" | "edit";
  initialValues?: UserFormData;
  allowedUserTypes?: ReadonlyArray<(typeof userTypeOptions)[number]>;
  onClose: () => void;
  onSubmit: (values: UserFormData) => Promise<void>;
}>;

function getUserTypeIcon(type: UserTypeValue) {
  const iconProps: SvgIconProps = { fontSize: "small", sx: { mr: 1 } };

  if (type === "admin") {
    return <AdminPanelSettings {...iconProps} />;
  }

  if (type === "volunteer") {
    return <VolunteerActivism {...iconProps} />;
  }

  return <Badge {...iconProps} />;
}

export function UserFormDialog({
  open,
  mode,
  initialValues,
  allowedUserTypes,
  onClose,
  onSubmit,
}: UserFormDialogProps) {
  const resolvedUserTypeOptions =
    allowedUserTypes && allowedUserTypes.length > 0
      ? allowedUserTypes
      : userTypeOptions;

  const [formValues, setFormValues] = useState<UserFormData>(
    initialValues ?? emptyUserForm,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextFormValues = initialValues ?? emptyUserForm;
    const hasCurrentType = resolvedUserTypeOptions.some(
      (option) => option.value === nextFormValues.userType,
    );

    setFormValues({
      ...nextFormValues,
      userType: hasCurrentType
        ? nextFormValues.userType
        : (resolvedUserTypeOptions[0]?.value ?? "operator"),
    });
    setSubmitError(null);
  }, [initialValues, open, resolvedUserTypeOptions]);

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
      const message = getErrorMessage(error, "Salvataggio non riuscito.");
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
              select
              label="Tipo utente"
              value={formValues.userType}
              onChange={(event) =>
                handleFieldChange(
                  "userType",
                  event.target.value as UserFormData["userType"],
                )
              }
              required
            >
              {resolvedUserTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Stack direction="row" alignItems="center">
                    {getUserTypeIcon(option.value)}
                    {option.label}
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
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
