// Definizione ruoli e struttura menu centrale per l'applicazione

import React from "react";
import type { AuthSession } from "@/core/auth/types";

export type UserRole = "SUPER_USER" | "ORG_ADMIN" | "VOLUNTEER";

export interface MenuItem {
  label: string;
  path: string;
  iconKey?: string;
  icon?: React.ReactNode;
  roles: UserRole[];
}

const rolePriority: UserRole[] = ["SUPER_USER", "ORG_ADMIN", "VOLUNTEER"];

function normalizeRole(role: string) {
  return role
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function toUserRole(
  role: string | null | undefined,
): UserRole | undefined {
  if (!role) {
    return undefined;
  }

  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "SUPER_USER") {
    return "SUPER_USER";
  }

  if (normalizedRole === "ADMIN") {
    return "SUPER_USER";
  }

  if (
    normalizedRole === "ORG_ADMIN" ||
    normalizedRole === "ORGADMIN" ||
    normalizedRole === "ORGANIZATION_ADMIN" ||
    normalizedRole === "ORGANIZATIONADMIN"
  ) {
    return "ORG_ADMIN";
  }

  if (normalizedRole === "OPERATOR") {
    return "ORG_ADMIN";
  }

  if (
    normalizedRole === "VOLUNTEER" ||
    normalizedRole === "VOLONTARIO" ||
    normalizedRole === "VOLUNTEER_USER"
  ) {
    return "VOLUNTEER";
  }

  return undefined;
}

export function getPrimaryRoleFromRoles(
  roles: string[] | null | undefined,
): UserRole | undefined {
  if (!roles || roles.length === 0) {
    return undefined;
  }

  const mappedRoles = roles
    .map((role) => toUserRole(role))
    .filter((role): role is UserRole => Boolean(role));

  return rolePriority.find((role) => mappedRoles.includes(role));
}

export function getPrimaryRoleFromSession(
  session: AuthSession | null | undefined,
): UserRole | undefined {
  const primaryFromSession = getPrimaryRoleFromRoles(session?.roles);
  if (primaryFromSession) {
    return primaryFromSession;
  }

  const membershipRoles =
    session?.memberships?.flatMap((membership) => membership.roles) ?? [];

  return getPrimaryRoleFromRoles(membershipRoles);
}

export function getEffectiveRoleFromSession(
  session: AuthSession | null | undefined,
): UserRole | undefined {
  const primaryRole = getPrimaryRoleFromSession(session);
  if (!primaryRole) {
    return undefined;
  }

  if (primaryRole === "SUPER_USER" && session?.activeOrganizationId) {
    return "ORG_ADMIN";
  }

  return primaryRole;
}

// Nota: la proprietà iconKey è una stringa che verrà mappata a una icona React nel componente UI
export const MENU_ITEMS: MenuItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    iconKey: "Dashboard",
    roles: ["SUPER_USER", "ORG_ADMIN", "VOLUNTEER"],
  },
  {
    label: "Organizzazioni",
    path: "/organizations",
    iconKey: "Apartment",
    roles: ["SUPER_USER"],
  },
  {
    label: "Utenti",
    path: "/users",
    iconKey: "Group",
    roles: ["SUPER_USER", "ORG_ADMIN"],
  },
  {
    label: "Volontari",
    path: "/volunteers",
    iconKey: "VolunteerActivism",
    roles: ["ORG_ADMIN"],
  },
  {
    label: "Clienti",
    path: "/clients",
    iconKey: "Business",
    roles: ["ORG_ADMIN"],
  },
  {
    label: "Destinazioni",
    path: "/destinations",
    iconKey: "Place",
    roles: ["ORG_ADMIN"],
  },
  {
    label: "Veicoli",
    path: "/vehicles",
    iconKey: "DirectionsCar",
    roles: ["ORG_ADMIN"],
  },
  {
    label: "Trasporti-sociali",
    path: "/transport-services",
    iconKey: "LocalShipping",
    roles: ["ORG_ADMIN", "VOLUNTEER"],
  },
  {
    label: "Le mie attivita",
    path: "/my-activities",
    iconKey: "AssignmentTurnedIn",
    roles: ["VOLUNTEER"],
  },
];
