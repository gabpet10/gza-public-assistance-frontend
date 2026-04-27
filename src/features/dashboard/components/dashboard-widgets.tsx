"use client";

import { Alert, Chip, Stack, Typography, alpha, useTheme } from "@mui/material";
import { ContentCard } from "@/shared/ui/content-card";
import { StatCard } from "@/shared/ui/stat-card";
import type {
  DashboardAlert,
  DashboardServiceDistribution,
  DashboardTrendPoint,
  DashboardVolunteerRank,
  RecentActivity,
  UpcomingActivity,
} from "@/features/dashboard/api/types";

export function KpiGrid({
  items,
}: Readonly<{
  items: Array<{
    label: string;
    value: string;
    detail?: string;
    icon?: React.ReactNode;
  }>;
}>) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          detail={item.detail}
          icon={item.icon}
        />
      ))}
    </div>
  );
}

export function PanelTitle({
  title,
  subtitle,
}: Readonly<{ title: string; subtitle?: string }>) {
  return (
    <Stack spacing={0.5} sx={{ mb: 2 }}>
      <Typography variant="sectionTitle">{title}</Typography>
      {subtitle ? (
        <Typography variant="bodySmall" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle?: string; children: React.ReactNode }>) {
  return (
    <ContentCard className="h-full">
      <PanelTitle title={title} subtitle={subtitle} />
      {children}
    </ContentCard>
  );
}

export function ServiceDistributionLegend({
  data,
}: Readonly<{ data: DashboardServiceDistribution[] }>) {
  const theme = useTheme();

  return (
    <Stack spacing={1.25} sx={{ mt: 1.5 }}>
      {data.map((entry, index) => (
        <Stack
          key={entry.serviceType}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 1.2,
            py: 0.75,
            borderRadius: 2,
            backgroundColor: alpha(
              theme.palette.info.light,
              0.09 + index * 0.02,
            ),
          }}
        >
          <Typography variant="bodySmall">{entry.serviceType}</Typography>
          <Chip size="small" label={entry.count} sx={{ fontWeight: 700 }} />
        </Stack>
      ))}
    </Stack>
  );
}

export function AlertsList({ alerts }: Readonly<{ alerts: DashboardAlert[] }>) {
  return (
    <Stack spacing={1.2}>
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          severity={
            alert.severity === "critical"
              ? "error"
              : alert.severity === "warning"
                ? "warning"
                : "info"
          }
          variant="outlined"
        >
          <Typography variant="bodySmall" fontWeight={700}>
            {alert.title}
          </Typography>
          <Typography variant="bodySmall">{alert.description}</Typography>
        </Alert>
      ))}
    </Stack>
  );
}

export function TopVolunteersList({
  volunteers,
}: Readonly<{ volunteers: DashboardVolunteerRank[] }>) {
  return (
    <Stack spacing={1.2}>
      {volunteers.map((volunteer, index) => (
        <Stack
          key={volunteer.volunteerId}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 1.2,
            py: 1,
            borderRadius: 2,
            border: "1px solid var(--border-soft)",
          }}
        >
          <Stack spacing={0.25}>
            <Typography variant="bodyMedium" fontWeight={700}>
              {index + 1}. {volunteer.fullName}
            </Typography>
            <Typography variant="bodySmall" color="text.secondary">
              {volunteer.hours} ore
            </Typography>
          </Stack>
          <Chip size="small" label={`${volunteer.interventions} interventi`} />
        </Stack>
      ))}
    </Stack>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function UpcomingActivitiesList({
  activities,
}: Readonly<{ activities: UpcomingActivity[] }>) {
  return (
    <Stack spacing={1.2}>
      {activities.map((activity) => (
        <Stack
          key={activity.id}
          spacing={0.35}
          sx={{
            px: 1.2,
            py: 1,
            borderRadius: 2,
            border: "1px solid var(--border-soft)",
          }}
        >
          <Typography variant="bodyMedium" fontWeight={700}>
            {activity.title}
          </Typography>
          <Typography variant="bodySmall" color="text.secondary">
            {activity.serviceType} • {activity.location}
          </Typography>
          <Typography variant="bodySmall">
            {formatDateTime(activity.scheduledAt)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export function RecentActivitiesList({
  activities,
}: Readonly<{ activities: RecentActivity[] }>) {
  return (
    <Stack spacing={1.2}>
      {activities.map((activity) => (
        <Stack
          key={activity.id}
          spacing={0.35}
          sx={{
            px: 1.2,
            py: 1,
            borderRadius: 2,
            border: "1px solid var(--border-soft)",
          }}
        >
          <Typography variant="bodyMedium" fontWeight={700}>
            {activity.title}
          </Typography>
          <Typography variant="bodySmall" color="text.secondary">
            {activity.serviceType}
          </Typography>
          <Typography variant="bodySmall">
            {formatDateTime(activity.happenedAt)} • {activity.durationHours} ore
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export function trendToSeries(points: DashboardTrendPoint[]) {
  return {
    labels: points.map((point) => point.label),
    values: points.map((point) => point.value),
  };
}
