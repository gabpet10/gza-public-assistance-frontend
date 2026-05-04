"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { workspaceCompactSecondaryActionButtonSx } from "@/shared/ui/workspace-styles";

type ConfirmActionDialogProps = Readonly<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isConfirming?: boolean;
  errorMessage?: string | null;
}>;

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
  isConfirming = false,
  errorMessage,
}: ConfirmActionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={isConfirming ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="bodyMedium" color="text.secondary">
            {description}
          </Typography>
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          size="small"
          onClick={onClose}
          variant="outlined"
          sx={workspaceCompactSecondaryActionButtonSx}
          disabled={isConfirming}
        >
          Annulla
        </Button>
        <Button
          size="small"
          onClick={() => void onConfirm()}
          color="error"
          variant="contained"
          sx={workspaceCompactSecondaryActionButtonSx}
          disabled={isConfirming}
        >
          {isConfirming ? "Operazione in corso..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
