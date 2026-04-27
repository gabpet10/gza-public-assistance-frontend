"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AccountCircle,
  EmailOutlined,
  LockOutlined,
  LockOpen,
  ShieldOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
  VolunteerActivism,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getProblemMessage } from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import { ContentCard } from "@/shared/ui/content-card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isAuthenticated, isReady, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSafePostLoginTarget = useCallback(
    (mustChangePassword: boolean) => {
      if (mustChangePassword) {
        return "/change-password?mode=forced";
      }

      const nextTarget = searchParams.get("next");
      if (!nextTarget || !nextTarget.startsWith("/")) {
        return "/dashboard";
      }

      // Prevent stale redirects to change-password when password change is not required.
      if (
        nextTarget === "/change-password" ||
        nextTarget.startsWith("/change-password?")
      ) {
        return "/dashboard";
      }

      return nextTarget;
    },
    [searchParams],
  );

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace(
        getSafePostLoginTarget(Boolean(session?.mustChangePassword)),
      );
    }
  }, [
    isAuthenticated,
    getSafePostLoginTarget,
    isReady,
    router,
    session?.mustChangePassword,
  ]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await login({ email, password });
      router.replace(getSafePostLoginTarget(response.mustChangePassword));
    } catch (error) {
      const message =
        error instanceof Error
          ? getProblemMessage((error as { problem?: unknown }).problem as never)
          : "Accesso non riuscito.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContentCard className="mx-auto w-full max-w-[560px] border-[color:var(--border-strong)] bg-white/85 p-7 shadow-[0_30px_72px_rgba(8,19,31,0.08)] md:min-h-[560px] md:rounded-[14px] md:p-9">
      <div className="mb-7 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[color:var(--accent)] text-white shadow-panel">
          <VolunteerActivism fontSize="medium" />
        </div>

        <div className="flex-1">
          <Typography
            variant="sectionEyebrow"
            sx={{ fontSize: { xs: "1rem", md: "1.125rem" } }}
          >
            GZA Public Assistance
          </Typography>
        </div>
      </div>

      <Divider sx={{ mb: 4, borderColor: "var(--border-soft)" }} />

      <div className="mb-6 flex justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--background-soft)] text-[color:var(--accent)] shadow-[0_12px_30px_rgba(8,19,31,0.06)]">
          <AccountCircle sx={{ fontSize: 82 }} />
        </div>
      </div>

      <div>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            {errorMessage ? (
              <Alert severity="error">{errorMessage}</Alert>
            ) : null}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoFocus
              placeholder="nome.cognome@organizzazione.it"
              required
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Password"
              type={isPasswordVisible ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
                          isPasswordVisible
                            ? "Nascondi password"
                            : "Mostra password"
                        }
                        onClick={() => {
                          setIsPasswordVisible((currentValue) => !currentValue);
                        }}
                      >
                        {isPasswordVisible ? (
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
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={<LockOpen />}
              size="large"
              sx={{
                minHeight: 52,
                fontWeight: 700,
                fontSize: { xs: "1rem", md: "1.0625rem" },
                backgroundColor: "var(--accent-secondary)",
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: "#0c5b65",
                },
              }}
            >
              {isSubmitting ? "Accesso in corso..." : "Login"}
            </Button>
            <div className="flex items-center gap-2 pt-1 text-[color:var(--foreground-muted)]">
              <ShieldOutlined sx={{ fontSize: 18 }} />
              <Typography variant="bodySmall">
                Accesso protetto per operatori autorizzati.
              </Typography>
            </div>
          </Stack>
        </form>
      </div>
    </ContentCard>
  );
}
