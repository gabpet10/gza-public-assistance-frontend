"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { Place } from "@mui/icons-material";
import { getProblemMessage } from "@/core/api/errors";
import type { DestinationFormData } from "@/features/destinations/api/types";
import {
  normalizeSearchText,
  useItalianProvinces,
} from "@/core/geo/italian-address-data";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";
import { ItalianMunicipalityAutocomplete } from "@/shared/ui/italian-municipality-autocomplete";

const emptyDestinationForm: DestinationFormData = {
  organizationId: "",
  name: "",
  description: "",
  address: "",
  city: "",
  province: "",
  notes: "",
};

type DestinationFormDialogProps = Readonly<{
  open: boolean;
  mode: "create" | "edit";
  initialValues?: DestinationFormData;
  onClose: () => void;
  onSubmit: (values: DestinationFormData) => Promise<void>;
}>;

export function DestinationFormDialog({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
}: DestinationFormDialogProps) {
  const [formValues, setFormValues] = useState<DestinationFormData>(
    initialValues ?? emptyDestinationForm,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { options: provinces } = useItalianProvinces();

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(initialValues ?? emptyDestinationForm);
    setSubmitError(null);
  }, [initialValues, open]);

  const title = useMemo(
    () => (mode === "create" ? "Nuova destinazione" : "Modifica destinazione"),
    [mode],
  );

  const selectedProvinceOption = useMemo(
    () =>
      provinces.find(
        (province) =>
          normalizeSearchText(province.sigla) ===
          normalizeSearchText(formValues.province),
      ) ?? null,
    [formValues.province, provinces],
  );

  const handleFieldChange = <T extends keyof DestinationFormData>(
    field: T,
    value: DestinationFormData[T],
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
            icon={<Place sx={{ fontSize: 20 }} />}
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
              label="Descrizione"
              value={formValues.description}
              onChange={(event) =>
                handleFieldChange("description", event.target.value)
              }
              multiline
              minRows={2}
            />
            <TextField
              label="Indirizzo"
              value={formValues.address}
              onChange={(event) =>
                handleFieldChange("address", event.target.value)
              }
            />
            <ItalianMunicipalityAutocomplete
              label="Comune"
              value={formValues.city}
              onCityChange={(value) => handleFieldChange("city", value)}
              onMunicipalitySelected={(option) => {
                if (option?.province) {
                  handleFieldChange("province", option.province);
                }
              }}
            />
            <Autocomplete
              freeSolo
              options={provinces}
              value={selectedProvinceOption ?? formValues.province}
              getOptionLabel={(option) =>
                typeof option === "string"
                  ? option
                  : `${option.sigla} - ${option.name}`
              }
              onInputChange={(_, nextInputValue, reason) => {
                if (reason === "input") {
                  handleFieldChange("province", nextInputValue.toUpperCase());
                }
              }}
              onChange={(_, option) => {
                if (!option) {
                  handleFieldChange("province", "");
                  return;
                }

                if (typeof option === "string") {
                  handleFieldChange("province", option.toUpperCase());
                  return;
                }

                handleFieldChange("province", option.sigla);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Provincia" />
              )}
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
                ? "Crea destinazione"
                : "Salva modifiche"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
