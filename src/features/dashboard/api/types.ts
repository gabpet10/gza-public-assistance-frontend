import type { UserRole } from "@/core/auth/roles";

export type DashboardTrendPoint = {
  label: string;
  value: number;
};

export type DashboardServiceDistribution = {
  serviceType: string;
  count: number;
};

export type DashboardVolunteerRank = {
  volunteerId: string;
  fullName: string;
  interventions: number;
  hours: number;
};

export type DashboardAlertSeverity = "info" | "warning" | "critical";

export type DashboardAlert = {
  id: string;
  title: string;
  description: string;
  severity: DashboardAlertSeverity;
};

export type UpcomingActivity = {
  id: string;
  title: string;
  serviceType: string;
  scheduledAt: string;
  location: string;
};

export type RecentActivity = {
  id: string;
  title: string;
  serviceType: string;
  happenedAt: string;
  durationHours: number;
};

export type SuperUserDashboardData = {
  role: "SUPER_USER";
  activeOrganizations: number;
  activeUsers: number;
  activeVolunteers: number;
  monthRegistrations: number;
  monthlyTrend: DashboardTrendPoint[];
};

export type OrgAdminDashboardData = {
  role: "ORG_ADMIN";
  activeVolunteers: number;
  inactiveVolunteers: number;
  interventionsCurrentYear: number;
  monthlyInterventions: DashboardTrendPoint[];
  serviceDistribution: DashboardServiceDistribution[];
  topVolunteers: DashboardVolunteerRank[];
  alerts: DashboardAlert[];
};

export type VolunteerDashboardData = {
  role: "VOLUNTEER";
  interventionsCurrentYear: number;
  monthHours: number;
  monthlyInterventions: DashboardTrendPoint[];
  serviceInvolvement: DashboardServiceDistribution[];
  upcomingActivities: UpcomingActivity[];
  recentActivities: RecentActivity[];
};

export type RoleDashboardDataMap = {
  SUPER_USER: SuperUserDashboardData;
  ORG_ADMIN: OrgAdminDashboardData;
  VOLUNTEER: VolunteerDashboardData;
};

export type DashboardQueryInput = {
  organizationId?: string;
  userId: string;
};

export type DashboardDataSource = "mock" | "api";

export type DashboardDataProvider = {
  getByRole<T extends UserRole>(
    role: T,
    input: DashboardQueryInput,
  ): Promise<RoleDashboardDataMap[T]>;
};
