import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { ContentCard } from "@/shared/ui/content-card";

export function LoadingState({
  message = "Caricamento in corso...",
}: Readonly<{ message?: string }>) {
  return (
    <ContentCard>
      <Stack direction="row" spacing={2} alignItems="center">
        <CircularProgress size={22} />
        <Typography variant="bodyMedium">{message}</Typography>
      </Stack>
    </ContentCard>
  );
}

export function ErrorState({
  title = "Impossibile completare la richiesta.",
  description,
  onRetry,
}: Readonly<{ title?: string; description?: string; onRetry?: () => void }>) {
  return (
    <ContentCard>
      <Stack spacing={2}>
        <Alert severity="error">{title}</Alert>
        {description ? (
          <Typography variant="bodyMedium" color="text.secondary">
            {description}
          </Typography>
        ) : null}
        {onRetry ? (
          <div>
            <Button variant="contained" onClick={onRetry}>
              Riprova
            </Button>
          </div>
        ) : null}
      </Stack>
    </ContentCard>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: Readonly<{ title: string; description: string; action?: React.ReactNode }>) {
  return (
    <ContentCard>
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="sectionTitle">{title}</Typography>
        <Typography variant="bodyMedium" color="text.secondary">
          {description}
        </Typography>
        {action}
      </Stack>
    </ContentCard>
  );
}
