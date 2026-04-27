"use client";

import {
  Apartment,
  Group,
  PersonAddAlt1,
  VolunteerActivism,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import type { SuperUserDashboardData } from "@/features/dashboard/api/types";
import {
  ChartCard,
  KpiGrid,
  trendToSeries,
} from "@/features/dashboard/components/dashboard-widgets";

export function SuperUserDashboard({
  data,
}: Readonly<{ data: SuperUserDashboardData }>) {
  const trendSeries = trendToSeries(data.monthlyTrend);

  return (
    <Box className="space-y-4">
      <KpiGrid
        items={[
          {
            label: "Organizzazioni attive",
            value: String(data.activeOrganizations),
            detail: "Tenant operativi nel SaaS",
            icon: <Apartment color="secondary" />,
          },
          {
            label: "Utenti attivi",
            value: String(data.activeUsers),
            detail: "Operatori abilitati nell'ecosistema",
            icon: <Group color="info" />,
          },
          {
            label: "Volontari attivi",
            value: String(data.activeVolunteers),
            detail: "Volontari coinvolti nelle attività",
            icon: <VolunteerActivism color="success" />,
          },
          {
            label: "Nuove registrazioni mese",
            value: String(data.monthRegistrations),
            detail: "Nuovi utenti e volontari nel mese corrente",
            icon: <PersonAddAlt1 color="primary" />,
          },
        ]}
      />

      <ChartCard
        title="Trend mensile generale"
        subtitle="Andamento crescita utenza e operatività annuale"
      >
        <LineChart
          height={320}
          xAxis={[{ scaleType: "point", data: trendSeries.labels }]}
          series={[
            {
              data: trendSeries.values,
              label: "Indice attività",
              color: "#0f6d7a",
            },
          ]}
          margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
          grid={{ vertical: false, horizontal: true }}
        />
      </ChartCard>
    </Box>
  );
}
