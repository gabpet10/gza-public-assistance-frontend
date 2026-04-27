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
} from "@mui/material";
import { Handyman } from "@mui/icons-material";
import { getProblemMessage } from "@/core/api/errors";
import { skillTypeOptions } from "@/features/skills/api/types";
import type { SkillFormData } from "@/features/skills/api/types";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";

const emptySkillForm: SkillFormData = {
  name: "",
  type: "medico",
  isActive: true,
};

type SkillFormDialogProps = Readonly<{
  open: boolean;
  mode: "create" | "edit";
  initialValues?: SkillFormData;
  onClose: () => void;
  onSubmit: (values: SkillFormData) => Promise<void>;
}>;

export function SkillFormDialog({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
}: SkillFormDialogProps) {
  const [formValues, setFormValues] = useState<SkillFormData>(
    initialValues ?? emptySkillForm,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(initialValues ?? emptySkillForm);
    setSubmitError(null);
  }, [initialValues, open]);

  const title = useMemo(
    () => (mode === "create" ? "Nuova skill" : "Modifica skill"),
    [mode],
  );

  const handleFieldChange = <T extends keyof SkillFormData>(
    field: T,
    value: SkillFormData[T],
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
            icon={<Handyman sx={{ fontSize: 20 }} />}
            eyebrow={title}
          />
        </DialogTitle>
        <DialogContent sx={formDialogContentSx}>
          <Stack spacing={2.5} sx={{ pt: 1.5 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            <TextField
              label="Nome"
              value={formValues.name}
              onChange={(event) =>
                handleFieldChange("name", event.target.value)
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
                  event.target.value as SkillFormData["type"],
                )
              }
              required
            >
              {skillTypeOptions
                .filter((option) => option.value !== "all")
                .map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
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
              label="Skill attiva"
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
                ? "Crea skill"
                : "Salva modifiche"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
