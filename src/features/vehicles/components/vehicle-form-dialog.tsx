"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { DirectionsCar } from "@mui/icons-material";
import { getProblemMessage } from "@/core/api/errors";
import {
  type VehicleFormData,
  vehicleTypeOptions,
} from "@/features/vehicles/api/types";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";

const emptyVehicleForm: VehicleFormData = {
  organizationId: "",
  plateNumber: "",
  type: "ambulanza",
  description: "",
};

type VehicleFormDialogProps = Readonly<{
  open: boolean;
  mode: "create" | "edit";
  initialValues?: VehicleFormData;
  onClose: () => void;
  onSubmit: (values: VehicleFormData) => Promise<void>;
}>;

export function VehicleFormDialog({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
}: VehicleFormDialogProps) {
  const [formValues, setFormValues] = useState<VehicleFormData>(
    initialValues ?? emptyVehicleForm,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(initialValues ?? emptyVehicleForm);
    setSubmitError(null);
  }, [initialValues, open]);

  const title = useMemo(
    () => (mode === "create" ? "Nuovo veicolo" : "Modifica veicolo"),
    [mode],
  );

  const handleFieldChange = <T extends keyof VehicleFormData>(
    field: T,
    value: VehicleFormData[T],
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
            icon={<DirectionsCar sx={{ fontSize: 20 }} />}
            eyebrow={title}
          />
        </DialogTitle>
        <DialogContent sx={formDialogContentSx}>
          <Stack spacing={2.5} sx={{ pt: 1.5 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            <TextField
              label="Targa"
              value={formValues.plateNumber}
              onChange={(event) =>
                handleFieldChange(
                  "plateNumber",
                  event.target.value.toUpperCase(),
                )
              }
              required
            />
            <TextField
              select
              label="Tipo"
              value={formValues.type}
              onChange={(event) =>
                handleFieldChange(
                  "type",
                  event.target.value as VehicleFormData["type"],
                )
              }
              required
            >
              {vehicleTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Descrizione"
              value={formValues.description}
              onChange={(event) =>
                handleFieldChange("description", event.target.value)
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
                ? "Crea veicolo"
                : "Salva modifiche"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
