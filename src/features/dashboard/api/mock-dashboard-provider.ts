import type {
  DashboardDataProvider,
  DashboardQueryInput,
  RoleDashboardDataMap,
} from "@/features/dashboard/api/types";
import type { UserRole } from "@/core/auth/roles";

const monthTrend = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
];

function createSuperUserData(): RoleDashboardDataMap["SUPER_USER"] {
  return {
    role: "SUPER_USER",
    activeOrganizations: 42,
    activeUsers: 137,
    activeVolunteers: 968,
    monthRegistrations: 28,
    monthlyTrend: monthTrend.map((label, index) => ({
      label,
      value: [102, 115, 129, 137, 152, 160, 172, 174, 181, 189, 196, 205][
        index
      ],
    })),
  };
}

function createOrgAdminData(): RoleDashboardDataMap["ORG_ADMIN"] {
  return {
    role: "ORG_ADMIN",
    activeVolunteers: 84,
    inactiveVolunteers: 11,
    interventionsCurrentYear: 512,
    monthlyInterventions: monthTrend.map((label, index) => ({
      label,
      value: [31, 35, 38, 42, 44, 40, 43, 46, 49, 55, 61, 68][index],
    })),
    serviceDistribution: [
      { serviceType: "Trasporto sanitario", count: 128 },
      { serviceType: "Assistenza domiciliare", count: 97 },
      { serviceType: "Supporto eventi", count: 62 },
      { serviceType: "Protezione civile", count: 49 },
      { serviceType: "Logistica emergenze", count: 44 },
    ],
    topVolunteers: [
      {
        volunteerId: "v-01",
        fullName: "Marco Bianchi",
        interventions: 43,
        hours: 108,
      },
      {
        volunteerId: "v-02",
        fullName: "Giulia Rossi",
        interventions: 39,
        hours: 96,
      },
      {
        volunteerId: "v-03",
        fullName: "Elena Lombardi",
        interventions: 35,
        hours: 89,
      },
    ],
    alerts: [
      {
        id: "al-01",
        title: "Copertura notturna ridotta",
        description: "Mancano 2 volontari qualificati per il turno di sabato.",
        severity: "warning",
      },
      {
        id: "al-02",
        title: "Certificazione in scadenza",
        description:
          "5 volontari hanno certificazione BLSD in scadenza entro 30 giorni.",
        severity: "info",
      },
      {
        id: "al-03",
        title: "Picco richieste non presidiate",
        description:
          "Le richieste urgenti sono aumentate del 18% questa settimana.",
        severity: "critical",
      },
    ],
  };
}

function createVolunteerData(
  input: DashboardQueryInput,
): RoleDashboardDataMap["VOLUNTEER"] {
  void input;

  return {
    role: "VOLUNTEER",
    interventionsCurrentYear: 76,
    monthHours: 31,
    monthlyInterventions: monthTrend.map((label, index) => ({
      label,
      value: [4, 5, 6, 8, 7, 6, 5, 4, 8, 9, 7, 7][index],
    })),
    serviceInvolvement: [
      { serviceType: "Trasporto sanitario", count: 26 },
      { serviceType: "Assistenza domiciliare", count: 18 },
      { serviceType: "Supporto eventi", count: 12 },
      { serviceType: "Protezione civile", count: 9 },
    ],
    upcomingActivities: [
      {
        id: "up-01",
        title: "Turno ambulanza",
        serviceType: "Trasporto sanitario",
        scheduledAt: "2026-04-19T07:30:00.000Z",
        location: "Sede centrale",
      },
      {
        id: "up-02",
        title: "Assistenza domicilio area nord",
        serviceType: "Assistenza domiciliare",
        scheduledAt: "2026-04-21T13:00:00.000Z",
        location: "Distretto Nord",
      },
    ],
    recentActivities: [
      {
        id: "re-01",
        title: "Supporto manifestazione cittadina",
        serviceType: "Supporto eventi",
        happenedAt: "2026-04-13T15:00:00.000Z",
        durationHours: 4,
      },
      {
        id: "re-02",
        title: "Trasporto inter-ospedaliero",
        serviceType: "Trasporto sanitario",
        happenedAt: "2026-04-11T09:30:00.000Z",
        durationHours: 6,
      },
      {
        id: "re-03",
        title: "Pattuglia meteo emergenza",
        serviceType: "Protezione civile",
        happenedAt: "2026-04-08T19:00:00.000Z",
        durationHours: 3,
      },
    ],
  };
}

export const mockDashboardProvider: DashboardDataProvider = {
  async getByRole<T extends UserRole>(
    role: T,
    input: DashboardQueryInput,
  ): Promise<RoleDashboardDataMap[T]> {
    switch (role) {
      case "SUPER_USER":
        return createSuperUserData() as RoleDashboardDataMap[T];
      case "ORG_ADMIN":
        return createOrgAdminData() as RoleDashboardDataMap[T];
      case "VOLUNTEER":
        return createVolunteerData(input) as RoleDashboardDataMap[T];
      default:
        throw new Error("Ruolo non supportato dal provider mock dashboard.");
    }
  },
};
