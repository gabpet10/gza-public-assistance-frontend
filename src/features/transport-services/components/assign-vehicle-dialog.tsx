"use client";

import { useEffect, useState } from "react";
import { LocalShipping } from "@mui/icons-material";
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
import type {
  LookupSearchInput,
  LookupSearchResult,
} from "@/shared/ui/entity-lookup-dialog-field";
import { EntityLookupDialogField } from "@/shared/ui/entity-lookup-dialog-field";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";

type AssignVehicleDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  organizationId?: string;
  initialVehicleId: string;
  initialVehicleLabel: string;
  initialVehicleDescription: string;
  initialNote: string;
  onSearchVehicles: (
    input: LookupSearchInput,
    organizationId: string,
  ) => Promise<LookupSearchResult>;
  onClose: () => void;
  onSubmit: (vehicleId: string, note: string) => Promise<boolean>;
};

export function AssignVehicleDialog({
  open,
  isSubmitting,
  organizationId,
  initialVehicleId,
  initialVehicleLabel,
  initialVehicleDescription,
  initialNote,
  onSearchVehicles,
  onClose,
  onSubmit,
}: AssignVehicleDialogProps) {
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [vehicleDescription, setVehicleDescription] = useState("");
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setVehicleId(initialVehicleId);
    setVehicleLabel(initialVehicleLabel);
    setVehicleDescription(initialVehicleDescription);
    setNote(initialNote);
    setSubmitError(null);
  }, [
    initialNote,
    initialVehicleDescription,
    initialVehicleId,
    initialVehicleLabel,
    open,
  ]);

  const handleSubmit = async () => {
    if (!vehicleId.trim()) {
      setSubmitError("Seleziona un veicolo.");
      return;
    }

    setSubmitError(null);
    const didAssign = await onSubmit(vehicleId, note);
    if (didAssign) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ pb: 1.25 }}>
        <FeatureDialogTitle
          icon={<LocalShipping sx={{ fontSize: 20 }} />}
          eyebrow="Gestione veicolo"
        />
      </DialogTitle>
      <DialogContent sx={formDialogContentSx}>
        <Stack spacing={2.5} sx={{ pt: 1.5 }}>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}

          <EntityLookupDialogField
            label="Veicolo"
            dialogTitle="Seleziona veicolo"
            value={vehicleId ? [vehicleId] : []}
            selectedOptions={
              vehicleId
                ? [
                    {
                      id: vehicleId,
                      label: vehicleLabel || vehicleId,
                      description: vehicleDescription || undefined,
                    },
                  ]
                : []
            }
            required
            disabled={isSubmitting || !organizationId}
            triggerAriaLabel="Apri ricerca veicolo"
            onSearch={(input) =>
              organizationId
                ? onSearchVehicles(input, organizationId)
                : Promise.resolve({ items: [], hasNextPage: false })
            }
            onChange={(ids, options) => {
              setVehicleId(ids[0] ?? "");
              setVehicleLabel(options[0]?.label ?? "");
              setVehicleDescription(options[0]?.description ?? "");
            }}
          />

          <TextField
            label="Note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            multiline
            minRows={2}
            disabled={isSubmitting}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={formDialogActionsEndSx}>
        <Button
          variant="outlined"
          color="error"
          disabled={isSubmitting}
          onClick={onClose}
        >
          Annulla
        </Button>
        <Button
          variant="contained"
          sx={formDialogPrimaryActionSx}
          disabled={isSubmitting}
          onClick={() => {
            void handleSubmit();
          }}
        >
          {isSubmitting ? "Salvataggio..." : "Conferma veicolo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
