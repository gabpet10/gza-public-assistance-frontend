"use client";

import {
  AccessTime,
  AssignmentTurnedIn,
  EventAvailable,
  Insights,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import type { VolunteerDashboardData } from "@/features/dashboard/api/types";
import {
  ChartCard,
  KpiGrid,
  PanelTitle,
  RecentActivitiesList,
  ServiceDistributionLegend,
  UpcomingActivitiesList,
  trendToSeries,
} from "@/features/dashboard/components/dashboard-widgets";
import { ContentCard } from "@/shared/ui/content-card";

export function VolunteerDashboard({
  data,
}: Readonly<{ data: VolunteerDashboardData }>) {
  const trendSeries = trendToSeries(data.monthlyInterventions);

  return (
    <Box className="space-y-4">
      <KpiGrid
        items={[
          {
            label: "Interventi anno corrente",
            value: String(data.interventionsCurrentYear),
            detail: "Attività personali registrate nel 2026",
            icon: <AssignmentTurnedIn color="primary" />,
          },
          {
            label: "Ore mese corrente",
            value: String(data.monthHours),
            detail: "Ore completate nel mese",
            icon: <AccessTime color="secondary" />,
          },
          {
            label: "Servizi coinvolti",
            value: String(data.serviceInvolvement.length),
            detail: "Tipologie attività a cui partecipi",
            icon: <Insights color="info" />,
          },
          {
            label: "Prossime attività",
            value: String(data.upcomingActivities.length),
            detail: "Turni e interventi già pianificati",
            icon: <EventAvailable color="success" />,
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartCard
            title="Andamento interventi personali"
            subtitle="Trend mensile attività completate"
          >
            <LineChart
              height={320}
              xAxis={[{ scaleType: "point", data: trendSeries.labels }]}
              series={[
                {
                  data: trendSeries.values,
                  label: "Interventi",
                  color: "#0f6d7a",
                },
              ]}
              margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
              grid={{ vertical: false, horizontal: true }}
            />
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <ChartCard
            title="Tipologie servizio coinvolte"
            subtitle="Distribuzione attività personali"
          >
            <PieChart
              height={240}
              series={[
                {
                  data: data.serviceInvolvement.map((entry, index) => ({
                    id: index,
                    label: entry.serviceType,
                    value: entry.count,
                  })),
                  innerRadius: 46,
                  outerRadius: 90,
                  paddingAngle: 3,
                },
              ]}
            />
            <ServiceDistributionLegend data={data.serviceInvolvement} />
          </ChartCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ContentCard>
          <PanelTitle
            title="Prossimi turni/interventi"
            subtitle="Attività pianificate per i prossimi giorni"
          />
          <UpcomingActivitiesList activities={data.upcomingActivities} />
        </ContentCard>

        <ContentCard>
          <PanelTitle
            title="Storico recente"
            subtitle="Ultime attività completate"
          />
          <RecentActivitiesList activities={data.recentActivities} />
        </ContentCard>
      </div>
    </Box>
  );
}
