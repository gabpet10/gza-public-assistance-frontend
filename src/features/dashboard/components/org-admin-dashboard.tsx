"use client";

import {
  Campaign,
  Groups,
  Insights,
  VolunteerActivism,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import type { OrgAdminDashboardData } from "@/features/dashboard/api/types";
import {
  AlertsList,
  ChartCard,
  KpiGrid,
  PanelTitle,
  ServiceDistributionLegend,
  TopVolunteersList,
  trendToSeries,
} from "@/features/dashboard/components/dashboard-widgets";
import { ContentCard } from "@/shared/ui/content-card";

export function OrgAdminDashboard({
  data,
}: Readonly<{ data: OrgAdminDashboardData }>) {
  const trendSeries = trendToSeries(data.monthlyInterventions);

  return (
    <Box className="space-y-4">
      <KpiGrid
        items={[
          {
            label: "Volontari attivi",
            value: String(data.activeVolunteers),
            detail: "Disponibili su turni correnti",
            icon: <VolunteerActivism color="success" />,
          },
          {
            label: "Volontari inattivi",
            value: String(data.inactiveVolunteers),
            detail: "Da riattivare o riassegnare",
            icon: <Groups color="warning" />,
          },
          {
            label: "Interventi anno corrente",
            value: String(data.interventionsCurrentYear),
            detail: "Interventi registrati nel 2026",
            icon: <Insights color="primary" />,
          },
          {
            label: "Alert operativi",
            value: String(data.alerts.length),
            detail: "Eventi che richiedono attenzione",
            icon: <Campaign color="error" />,
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartCard
            title="Andamento interventi mese per mese"
            subtitle="Volume interventi anno corrente"
          >
            <BarChart
              height={320}
              xAxis={[{ scaleType: "band", data: trendSeries.labels }]}
              series={[
                {
                  data: trendSeries.values,
                  label: "Interventi",
                  color: "#d95f43",
                },
              ]}
              margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
              grid={{ vertical: false, horizontal: true }}
            />
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <ChartCard
            title="Attività per tipologia servizio"
            subtitle="Distribuzione interventi organizzazione"
          >
            <PieChart
              height={240}
              series={[
                {
                  data: data.serviceDistribution.map((entry, index) => ({
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
            <ServiceDistributionLegend data={data.serviceDistribution} />
          </ChartCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ContentCard>
          <PanelTitle
            title="Top volontari"
            subtitle="Operatori con maggior numero di interventi"
          />
          <TopVolunteersList volunteers={data.topVolunteers} />
        </ContentCard>
        <ContentCard>
          <PanelTitle
            title="Alert operativi"
            subtitle="Segnalazioni da monitorare nelle prossime ore"
          />
          <AlertsList alerts={data.alerts} />
        </ContentCard>
      </div>
    </Box>
  );
}
