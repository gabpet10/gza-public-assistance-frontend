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
import { PlaylistAdd } from "@mui/icons-material";
import { getProblemMessage } from "@/core/api/errors";
import {
  normalizeSkillType,
  skillTypeOptions,
} from "@/features/skills/api/types";
import {
  normalizeSkillLevel,
  skillLevelOptions,
  type VolunteerSkillFormData,
} from "@/features/volunteers/api/types";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";

const emptyVolunteerSkillForm: VolunteerSkillFormData = {
  skillType: "medico",
  level: "nessuno",
  verified: false,
};

type VolunteerSkillFormDialogProps = Readonly<{
  open: boolean;
  mode: "create" | "edit";
  initialValues?: VolunteerSkillFormData;
  onClose: () => void;
  onSubmit: (values: VolunteerSkillFormData) => Promise<void>;
}>;

export function VolunteerSkillFormDialog({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
}: VolunteerSkillFormDialogProps) {
  const [formValues, setFormValues] = useState<VolunteerSkillFormData>(
    initialValues ?? emptyVolunteerSkillForm,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(
      initialValues
        ? {
            ...initialValues,
            skillType: normalizeSkillType(initialValues.skillType) ?? "medico",
            level: normalizeSkillLevel(initialValues.level) ?? "nessuno",
          }
        : emptyVolunteerSkillForm,
    );
    setSubmitError(null);
  }, [initialValues, open]);

  const title = useMemo(
    () => (mode === "create" ? "Aggiungi skill" : "Modifica skill"),
    [mode],
  );

  const handleFieldChange = <T extends keyof VolunteerSkillFormData>(
    field: T,
    value: VolunteerSkillFormData[T],
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
            icon={<PlaylistAdd sx={{ fontSize: 20 }} />}
            eyebrow={title}
            title={title}
          />
        </DialogTitle>
        <DialogContent sx={formDialogContentSx}>
          <Stack spacing={2.5} sx={{ pt: 1.5 }}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            <TextField
              select
              label="Tipologia"
              value={formValues.skillType}
              onChange={(event) =>
                handleFieldChange(
                  "skillType",
                  event.target.value as VolunteerSkillFormData["skillType"],
                )
              }
              disabled={mode === "edit"}
              helperText={
                mode === "edit"
                  ? "La tipologia non puo essere cambiata in modifica skill volontario."
                  : undefined
              }
            >
              {skillTypeOptions
                .filter((option) => option.value !== "all")
                .map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              select
              label="Livello"
              value={formValues.level}
              onChange={(event) =>
                handleFieldChange(
                  "level",
                  event.target.value as VolunteerSkillFormData["level"],
                )
              }
              required
            >
              {skillLevelOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={formValues.verified}
                  onChange={(event) =>
                    handleFieldChange("verified", event.target.checked)
                  }
                />
              }
              label="Skill verificata"
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
                ? "Aggiungi skill"
                : "Salva modifiche"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
