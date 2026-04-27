import { Stack, Typography } from "@mui/material";
import { ContentCard } from "@/shared/ui/content-card";

type StatCardProps = Readonly<{
  label: string;
  value: string;
  detail?: string;
  icon?: React.ReactNode;
}>;

export function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <ContentCard className="h-full">
      <Stack spacing={1} direction="row" alignItems="center">
        {icon ? <span style={{ marginRight: 8 }}>{icon}</span> : null}
        <Stack spacing={0.5}>
          <Typography variant="sectionEyebrow">{label}</Typography>
          <Typography variant="h2">{value}</Typography>
          {detail ? (
            <Typography variant="bodySmall" color="text.secondary">
              {detail}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    </ContentCard>
  );
}
