"use client";

import { useEffect, useState } from "react";
import { GroupAdd } from "@mui/icons-material";
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
  Typography,
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
import type { AssignDialogMember } from "./transport-services-workspace-helpers";

type AssignVolunteersDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  organizationId?: string;
  initialTeamMembers: AssignDialogMember[];
  initialNote: string;
  onSearchVolunteers: (
    input: LookupSearchInput,
    organizationId: string,
  ) => Promise<LookupSearchResult>;
  onClose: () => void;
  onSubmit: (
    teamMembers: AssignDialogMember[],
    note: string,
  ) => Promise<boolean>;
};

export function AssignVolunteersDialog({
  open,
  isSubmitting,
  organizationId,
  initialTeamMembers,
  initialNote,
  onSearchVolunteers,
  onClose,
  onSubmit,
}: AssignVolunteersDialogProps) {
  const [teamMembers, setTeamMembers] = useState<AssignDialogMember[]>([]);
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setTeamMembers(initialTeamMembers);
    setNote(initialNote);
    setSubmitError(null);
  }, [initialNote, initialTeamMembers, open]);

  const handleSubmit = async () => {
    if (teamMembers.length === 0) {
      setSubmitError("Seleziona almeno un volontario.");
      return;
    }

    setSubmitError(null);
    const didAssign = await onSubmit(teamMembers, note);
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
          icon={<GroupAdd sx={{ fontSize: 20 }} />}
          eyebrow="Assegna volontari"
        />
      </DialogTitle>
      <DialogContent sx={formDialogContentSx}>
        <Stack spacing={2.5} sx={{ pt: 1.5 }}>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}

          <EntityLookupDialogField
            label="Volontari"
            dialogTitle="Seleziona volontari"
            value={teamMembers.map((member) => member.volunteerId)}
            selectedOptions={teamMembers.map((member) => ({
              id: member.volunteerId,
              label: member.label,
            }))}
            multiple
            required
            disabled={isSubmitting || !organizationId}
            triggerAriaLabel="Apri ricerca volontari"
            onSearch={(input) =>
              organizationId
                ? onSearchVolunteers(input, organizationId)
                : Promise.resolve({ items: [], hasNextPage: false })
            }
            onChange={(ids, options) => {
              setTeamMembers((current) =>
                ids.map((id, index) => {
                  const existing = current.find(
                    (member) => member.volunteerId === id,
                  );
                  const option = options.find((item) => item.id === id);

                  return {
                    volunteerId: id,
                    label: option?.label ?? existing?.label ?? "",
                    role:
                      existing?.role ?? (index === 0 ? "driver" : "attendant"),
                  };
                }),
              );
            }}
          />

          <Stack spacing={1}>
            <Typography variant="sectionEyebrow">
              Ruolo per volontario
            </Typography>
            {teamMembers.length ? (
              teamMembers.map((member) => (
                <Stack
                  key={member.volunteerId}
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.25}
                >
                  <TextField
                    label="Volontario"
                    value={member.label}
                    disabled
                    fullWidth
                  />
                  <TextField
                    select
                    label="Ruolo"
                    value={member.role}
                    onChange={(event) => {
                      const nextRole = event.target
                        .value as AssignDialogMember["role"];
                      setTeamMembers((current) =>
                        current.map((currentMember) =>
                          currentMember.volunteerId === member.volunteerId
                            ? { ...currentMember, role: nextRole }
                            : currentMember,
                        ),
                      );
                    }}
                    fullWidth
                  >
                    <MenuItem value="driver">Autista</MenuItem>
                    <MenuItem value="attendant">Accompagnatore</MenuItem>
                  </TextField>
                </Stack>
              ))
            ) : (
              <Typography variant="bodySmall" color="text.secondary">
                Seleziona almeno un volontario da assegnare.
              </Typography>
            )}
          </Stack>

          <TextField
            label="Note assegnazione"
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
          {isSubmitting ? "Assegnazione..." : "Conferma assegnazione"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
