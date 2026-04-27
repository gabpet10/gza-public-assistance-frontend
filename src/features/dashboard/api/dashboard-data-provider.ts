import type { UserRole } from "@/core/auth/roles";
import type {
  DashboardDataProvider,
  DashboardDataSource,
  DashboardQueryInput,
  RoleDashboardDataMap,
} from "@/features/dashboard/api/types";
import { mockDashboardProvider } from "@/features/dashboard/api/mock-dashboard-provider";

const apiDashboardProvider: DashboardDataProvider = {
  async getByRole<T extends UserRole>(
    role: T,
    input: DashboardQueryInput,
  ): Promise<RoleDashboardDataMap[T]> {
    void role;
    void input;
    throw new Error(
      "Provider API dashboard non ancora disponibile. Usa il provider mock.",
    );
  },
};

function resolveDataSource(): DashboardDataSource {
  const configuredSource = process.env.NEXT_PUBLIC_DASHBOARD_DATA_SOURCE;
  return configuredSource === "api" ? "api" : "mock";
}

export function getDashboardDataProvider(): DashboardDataProvider {
  return resolveDataSource() === "api"
    ? apiDashboardProvider
    : mockDashboardProvider;
}
