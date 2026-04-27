"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Stack } from "@mui/material";
import { SectionHeader } from "@/shared/ui/section-header";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/shared/ui/feedback-states";
import { useAuth } from "@/core/auth/auth-context";
import { getEffectiveRoleFromSession, type UserRole } from "@/core/auth/roles";
import { getDashboardDataProvider } from "@/features/dashboard/api/dashboard-data-provider";
import type {
  DashboardQueryInput,
  RoleDashboardDataMap,
} from "@/features/dashboard/api/types";
import { SuperUserDashboard } from "@/features/dashboard/components/super-user-dashboard";
import { OrgAdminDashboard } from "@/features/dashboard/components/org-admin-dashboard";
import { VolunteerDashboard } from "@/features/dashboard/components/volunteer-dashboard";

type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      role: UserRole;
      data: RoleDashboardDataMap[UserRole];
    };

function getRoleTitle(role: UserRole) {
  switch (role) {
    case "SUPER_USER":
      return "Dashboard Super User";
    case "ORG_ADMIN":
      return "Dashboard Amministratore Organizzazione";
    case "VOLUNTEER":
      return "Dashboard Volontario";
    default:
      return "Dashboard";
  }
}

export function DashboardOverview() {
  const { session } = useAuth();
  const role = getEffectiveRoleFromSession(session);

  const provider = useMemo(() => getDashboardDataProvider(), []);
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  useEffect(() => {
    if (!session || !role) {
      setState({
        status: "error",
        message: "Ruolo utente non disponibile nella sessione corrente.",
      });
      return;
    }

    let isDisposed = false;

    const input: DashboardQueryInput = {
      userId: session.userId,
      organizationId:
        session.activeOrganizationId ??
        session.memberships?.[0]?.organizationId,
    };

    setState({ status: "loading" });

    provider
      .getByRole(role, input)
      .then((data) => {
        if (!isDisposed) {
          setState({ status: "ready", role, data });
        }
      })
      .catch((error) => {
        if (!isDisposed) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Caricamento dashboard non riuscito.",
          });
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [provider, role, session]);

  const roleTitle = role ? getRoleTitle(role) : "Dashboard";

  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Control Center"
        title={roleTitle}
        description="Vista operativa role-based con dataset mock tipizzato. L'integrazione backend KPI potrà sostituire il provider senza modificare i componenti UI."
      />

      {state.status === "loading" ? (
        <LoadingState message="Caricamento dashboard..." />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          title="Dashboard non disponibile"
          description={state.message}
        />
      ) : null}

      {state.status === "ready" && state.role === "SUPER_USER" ? (
        <SuperUserDashboard
          data={state.data as RoleDashboardDataMap["SUPER_USER"]}
        />
      ) : null}

      {state.status === "ready" && state.role === "ORG_ADMIN" ? (
        <OrgAdminDashboard
          data={state.data as RoleDashboardDataMap["ORG_ADMIN"]}
        />
      ) : null}

      {state.status === "ready" && state.role === "VOLUNTEER" ? (
        <VolunteerDashboard
          data={state.data as RoleDashboardDataMap["VOLUNTEER"]}
        />
      ) : null}

      {state.status === "ready" && !role ? (
        <EmptyState
          title="Nessun ruolo disponibile"
          description="Impossibile determinare la dashboard da mostrare."
        />
      ) : null}

      <Alert severity="info" variant="outlined">
        I dati mostrati sono mock: quando le API KPI saranno disponibili,
        basterà abilitare il provider API mantenendo invariata questa UI.
      </Alert>
    </Stack>
  );
}
