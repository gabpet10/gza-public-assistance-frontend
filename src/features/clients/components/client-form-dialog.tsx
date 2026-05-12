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
import { Business } from "@mui/icons-material";
import { toApiUiError } from "@/core/api/errors";
import type { ClientFormData } from "@/features/clients/api/types";
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

const emptyClientForm: ClientFormData = {
  organizationId: "",
  fiscalCode: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  aslNumber: "",
  aslMunicipality: "",
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
  const { options: provinces } = useItalianProvinces();

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

  const selectedProvinceOption = useMemo(
    () =>
      provinces.find(
        (province) =>
          normalizeSearchText(province.sigla) ===
          normalizeSearchText(formValues.province),
      ) ?? null,
    [formValues.province, provinces],
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
              label="Numero ASL"
              value={formValues.aslNumber}
              onChange={(event) =>
                handleFieldChange("aslNumber", event.target.value)
              }
            />
            <TextField
              label="Comune ASL"
              value={formValues.aslMunicipality}
              onChange={(event) =>
                handleFieldChange("aslMunicipality", event.target.value)
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
