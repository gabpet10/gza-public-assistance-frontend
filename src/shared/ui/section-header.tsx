import { Stack, Typography } from "@mui/material";

type SectionHeaderProps = Readonly<{
  eyebrow?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}>;

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <Stack spacing={1}>
        {eyebrow ? (
          <Typography variant="sectionEyebrow">{eyebrow}</Typography>
        ) : null}
        <Typography variant="sectionTitle">{title}</Typography>
        {description ? (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={{ maxWidth: 760 }}
          >
            {description}
          </Typography>
        ) : null}
      </Stack>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
