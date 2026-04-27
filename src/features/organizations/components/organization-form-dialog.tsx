"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Apartment, UploadFile } from "@mui/icons-material";
import { getProblemMessage } from "@/core/api/errors";
import type { OrganizationFormData } from "@/features/organizations/api/types";
import {
  FeatureDialogTitle,
  formDialogActionsSplitSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";

const wizardSteps = ["Organizzazione", "Operatore"] as const;

const emptyOrganizationForm: OrganizationFormData = {
  name: "",
  logo: "",
  vatNumber: "",
  address: "",
  city: "",
  region: "",
  isActive: true,
  operatorEmail: "",
  operatorFirstName: "",
  operatorLastName: "",
  operatorPhone: "",
  operatorPassword: "",
};

type OrganizationFormDialogProps = Readonly<{
  open: boolean;
  initialValues?: OrganizationFormData;
  onClose: () => void;
  onSubmit: (values: OrganizationFormData) => Promise<void>;
}>;

async function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawValue = String(reader.result ?? "");
      const base64Value = rawValue.includes(",")
        ? (rawValue.split(",")[1] ?? "")
        : rawValue;
      resolve(base64Value);
    };
    reader.onerror = () => reject(new Error("Lettura logo non riuscita."));
    reader.readAsDataURL(file);
  });
}

function toLogoSrc(logo: string) {
  if (!logo) {
    return null;
  }

  if (logo.startsWith("data:")) {
    return logo;
  }

  return `data:image/png;base64,${logo}`;
}

export function OrganizationFormDialog({
  open,
  initialValues,
  onClose,
  onSubmit,
}: OrganizationFormDialogProps) {
  const isEditMode = Boolean(initialValues);
  const [activeStep, setActiveStep] = useState(0);
  const [formValues, setFormValues] = useState<OrganizationFormData>(
    initialValues ?? emptyOrganizationForm,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(initialValues ?? emptyOrganizationForm);
    setSubmitError(null);
    setActiveStep(0);
  }, [initialValues, open]);

  const title = useMemo(
    () => (isEditMode ? "Modifica organizzazione" : "Nuova organizzazione"),
    [isEditMode],
  );

  const handleFieldChange = <T extends keyof OrganizationFormData>(
    field: T,
    value: OrganizationFormData[T],
  ) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const organizationStepError = useMemo(() => {
    if (!formValues.name.trim()) {
      return "Il nome organizzazione e obbligatorio.";
    }

    return null;
  }, [formValues.name]);

  const operatorStepError = useMemo(() => {
    if (isEditMode) {
      return null;
    }

    if (!formValues.operatorEmail?.trim()) {
      return "Email operatore obbligatoria.";
    }

    if (!formValues.operatorPassword?.trim()) {
      return "Password operatore obbligatoria.";
    }

    return null;
  }, [formValues.operatorEmail, formValues.operatorPassword, isEditMode]);

  const isCreateWizard = !isEditMode;
  const isLastStep = !isCreateWizard || activeStep === wizardSteps.length - 1;

  const handleNext = () => {
    if (organizationStepError) {
      setSubmitError(organizationStepError);
      return;
    }

    setSubmitError(null);
    setActiveStep(1);
  };

  const handleBack = () => {
    setSubmitError(null);
    setActiveStep(0);
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSubmitError(null);

    try {
      const base64Logo = await toBase64(file);
      handleFieldChange("logo", base64Logo);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Logo non valido.",
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLastStep) {
      handleNext();
      return;
    }

    if (organizationStepError) {
      setSubmitError(organizationStepError);
      return;
    }

    if (operatorStepError) {
      setSubmitError(operatorStepError);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formValues);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? (error as { problem?: never }).problem
            ? getProblemMessage((error as { problem?: never }).problem)
            : error.message
          : "Salvataggio non riuscito.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const logoSrc = toLogoSrc(formValues.logo);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1.25 }}>
          <FeatureDialogTitle
            icon={<Apartment sx={{ fontSize: 20 }} />}
            eyebrow={title}
          />
        </DialogTitle>
        <DialogContent sx={formDialogContentSx}>
          <Stack spacing={2.5} sx={{ pt: isCreateWizard ? 0.5 : 1.5 }}>
            {isCreateWizard ? (
              <Stepper activeStep={activeStep} alternativeLabel>
                {wizardSteps.map((stepLabel) => (
                  <Step key={stepLabel}>
                    <StepLabel>{stepLabel}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            ) : null}

            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            {activeStep === 0 ? (
              <>
                <TextField
                  label="Nome"
                  value={formValues.name}
                  onChange={(event) =>
                    handleFieldChange("name", event.target.value)
                  }
                  required
                />
                <TextField
                  label="Partita IVA"
                  value={formValues.vatNumber}
                  onChange={(event) =>
                    handleFieldChange("vatNumber", event.target.value)
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
                  label="Regione"
                  value={formValues.region}
                  onChange={(event) =>
                    handleFieldChange("region", event.target.value)
                  }
                />
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<UploadFile />}
                  >
                    Carica logo
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleLogoUpload}
                    />
                  </Button>
                  {logoSrc ? (
                    <Avatar src={logoSrc} sx={{ width: 44, height: 44 }} />
                  ) : null}
                </Stack>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formValues.isActive}
                      onChange={(event) =>
                        handleFieldChange("isActive", event.target.checked)
                      }
                    />
                  }
                  label="Attiva organizzazione"
                />
              </>
            ) : null}

            {activeStep === 1 && isCreateWizard ? (
              <>
                <Typography
                  variant="bodySmall"
                  sx={{ color: "text.secondary" }}
                >
                  Crea un utente operatore iniziale della nuova organizzazione.
                </Typography>
                <TextField
                  label="Email operatore"
                  type="email"
                  value={formValues.operatorEmail}
                  onChange={(event) =>
                    handleFieldChange("operatorEmail", event.target.value)
                  }
                  required
                />
                <TextField
                  label="Password operatore"
                  type="password"
                  value={formValues.operatorPassword}
                  onChange={(event) =>
                    handleFieldChange("operatorPassword", event.target.value)
                  }
                  required
                />
                <TextField
                  label="Nome operatore"
                  value={formValues.operatorFirstName}
                  onChange={(event) =>
                    handleFieldChange("operatorFirstName", event.target.value)
                  }
                />
                <TextField
                  label="Cognome operatore"
                  value={formValues.operatorLastName}
                  onChange={(event) =>
                    handleFieldChange("operatorLastName", event.target.value)
                  }
                />
                <TextField
                  label="Telefono operatore"
                  value={formValues.operatorPhone}
                  onChange={(event) =>
                    handleFieldChange("operatorPhone", event.target.value)
                  }
                />
              </>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={formDialogActionsSplitSx}>
          <Box sx={{ display: "flex", gap: 1 }}>
            {isCreateWizard && activeStep > 0 ? (
              <Button onClick={handleBack} variant="outlined">
                Indietro
              </Button>
            ) : null}
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={onClose} variant="outlined" color="error">
              Annulla
            </Button>
            {isLastStep ? (
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={formDialogPrimaryActionSx}
              >
                {isSubmitting
                  ? "Salvataggio..."
                  : isEditMode
                    ? "Salva modifiche "
                    : "Crea organizzazione"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="contained"
                onClick={handleNext}
                sx={formDialogPrimaryActionSx}
              >
                Avanti
              </Button>
            )}
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}
