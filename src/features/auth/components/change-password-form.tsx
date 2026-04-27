"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogActions,
  DialogContent,
  Alert,
  Button,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  LockOutlined,
  LockReset,
  PasswordOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { getProblemMessage } from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import {
  FeatureDialogTitle,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "@/shared/ui/form-dialog-frame";

const minimumPasswordLength = 8;

export function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, changePassword, logout, refreshSession } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mode = searchParams.get("mode");
  const isForcedMode = Boolean(session?.mustChangePassword);
  const returnTo = searchParams.get("returnTo");
  const safeReturnTo =
    returnTo && returnTo.startsWith("/") ? returnTo : "/dashboard";

  const validationMessage = useMemo(() => {
    if (!newPassword || !confirmPassword) {
      return null;
    }

    if (newPassword.length < minimumPasswordLength) {
      return `La nuova password deve contenere almeno ${minimumPasswordLength} caratteri.`;
    }

    if (newPassword !== confirmPassword) {
      return "Le password non coincidono.";
    }

    if (currentPassword && currentPassword === newPassword) {
      return "La nuova password deve essere diversa da quella attuale.";
    }

    return null;
  }, [confirmPassword, currentPassword, newPassword]);

  const handleCloseOptional = () => {
    router.replace(safeReturnTo);
  };

  const handleExit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!isForcedMode) {
      handleCloseOptional();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      const message =
        error instanceof Error
          ? getProblemMessage((error as { problem?: unknown }).problem as never)
          : "Uscita non riuscita.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      const session = await refreshSession();
      if (!session) {
        setErrorMessage(
          "La sessione non e piu valida. Effettua un nuovo accesso.",
        );
        router.replace("/login");
        return;
      }

      if (session.mustChangePassword) {
        setErrorMessage(
          "Aggiornamento riuscito, ma la sessione non e ancora allineata. Riprova tra pochi secondi.",
        );
        return;
      }

      const destination = mode === "forced" ? "/dashboard" : safeReturnTo;
      router.replace(destination);
    } catch (error) {
      const message =
        error instanceof Error
          ? getProblemMessage((error as { problem?: unknown }).problem as never)
          : "Cambio password non riuscito.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onClose={(_, reason) => {
        if (isSubmitting || isForcedMode) {
          return;
        }

        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          handleCloseOptional();
        }
      }}
      disableEscapeKeyDown={isForcedMode}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            border: "1px solid rgba(8, 19, 31, 0.12)",
            boxShadow: "0 30px 72px rgba(8,19,31,0.18)",
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pb: 1.25, pt: 2.5 }}>
        <FeatureDialogTitle
          icon={<PasswordOutlined sx={{ fontSize: 20 }} />}
          eyebrow="Cambio Password"
        />
      </DialogTitle>
      <DialogContent sx={formDialogContentSx}>
        <Typography
          variant="bodySmall"
          sx={{ mt: 0.5, color: "text.secondary" }}
        >
          {isForcedMode
            ? "Al primo accesso devi aggiornare la password per continuare."
            : "Aggiorna la password del tuo account."}
        </Typography>

        <form
          id="change-password-form"
          onSubmit={handleSubmit}
          className="mt-6"
          autoComplete="on"
        >
          <Stack spacing={2.5}>
            {errorMessage ? (
              <Alert severity="error">{errorMessage}</Alert>
            ) : null}
            <TextField
              id="current-password"
              name="currentPassword"
              label="Password attuale"
              type={isCurrentPasswordVisible ? "text" : "password"}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        type="button"
                        aria-label={
                          isCurrentPasswordVisible
                            ? "Nascondi password attuale"
                            : "Mostra password attuale"
                        }
                        onClick={() =>
                          setIsCurrentPasswordVisible(
                            (currentValue) => !currentValue,
                          )
                        }
                      >
                        {isCurrentPasswordVisible ? (
                          <VisibilityOffOutlined fontSize="small" />
                        ) : (
                          <VisibilityOutlined fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              id="new-password"
              name="newPassword"
              label="Nuova password"
              type={isNewPasswordVisible ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
              fullWidth
              helperText={`Minimo ${minimumPasswordLength} caratteri.`}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        type="button"
                        aria-label={
                          isNewPasswordVisible
                            ? "Nascondi nuova password"
                            : "Mostra nuova password"
                        }
                        onClick={() =>
                          setIsNewPasswordVisible(
                            (currentValue) => !currentValue,
                          )
                        }
                      >
                        {isNewPasswordVisible ? (
                          <VisibilityOffOutlined fontSize="small" />
                        ) : (
                          <VisibilityOutlined fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              id="confirm-new-password"
              name="confirmNewPassword"
              label="Conferma nuova password"
              type={isConfirmPasswordVisible ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        type="button"
                        aria-label={
                          isConfirmPasswordVisible
                            ? "Nascondi conferma password"
                            : "Mostra conferma password"
                        }
                        onClick={() =>
                          setIsConfirmPasswordVisible(
                            (currentValue) => !currentValue,
                          )
                        }
                      >
                        {isConfirmPasswordVisible ? (
                          <VisibilityOffOutlined fontSize="small" />
                        ) : (
                          <VisibilityOutlined fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </form>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.75, gap: 1.25 }}>
        <Button
          type="button"
          variant="outlined"
          disabled={isSubmitting}
          onClick={() => {
            void handleExit();
          }}
          sx={{ minHeight: 48, fontWeight: 700 }}
        >
          Esci
        </Button>
        <Button
          type="submit"
          variant="contained"
          form="change-password-form"
          disabled={isSubmitting}
          startIcon={<LockReset />}
          size="large"
          sx={{
            ...formDialogPrimaryActionSx,
            minHeight: 48,
            fontWeight: 700,
            fontSize: { xs: "0.975rem", md: "1rem" },
          }}
        >
          {isSubmitting ? "Aggiornamento in corso..." : "Aggiorna password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
