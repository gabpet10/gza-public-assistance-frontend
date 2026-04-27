"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AssignmentTurnedIn,
  Dashboard,
  Handyman,
  MenuOpen,
  PushPin,
  PushPinOutlined,
  VolunteerActivism,
  Apartment,
  Group,
  Business,
  Place,
  DirectionsCar,
} from "@mui/icons-material";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Button,
  useTheme,
} from "@mui/material";
// import { PageContainer } from "@/shared/ui/page-container";
import { useAuth } from "@/core/auth/auth-context";
import { usePermissions } from "@/core/auth/use-permissions";
import { getPrimaryRoleFromSession } from "@/core/auth/roles";
import { UserStatusMenu } from "@/shared/ui/user-status-menu";

const menuIcons: Record<string, React.ReactNode> = {
  Dashboard: <Dashboard fontSize="medium" />,
  VolunteerActivism: <VolunteerActivism fontSize="medium" />,
  AssignmentTurnedIn: <AssignmentTurnedIn fontSize="medium" />,
  Apartment: <Apartment fontSize="medium" />,
  Group: <Group fontSize="medium" />,
  Handyman: <Handyman fontSize="medium" />,
  Business: <Business fontSize="medium" />,
  Place: <Place fontSize="medium" />,
  DirectionsCar: <DirectionsCar fontSize="medium" />,
};

const drawerWidth = 248;
const shellPreferenceKey = "gza-shell-sidebar-mode";

function getDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string | null | undefined,
) {
  const fullName = [firstName, lastName]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  if (email) {
    const localPart = email.split("@")[0] ?? "";
    const normalized = localPart.replace(/[._-]+/g, " ").trim();
    if (normalized) {
      return normalized
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    }
  }

  return "Utente";
}

function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  displayName: string,
  email: string | null | undefined,
) {
  const safeFirstName = firstName?.trim();
  const safeLastName = lastName?.trim();

  if (safeFirstName && safeLastName) {
    return `${safeFirstName[0]}${safeLastName[0]}`.toUpperCase();
  }

  const nameParts = displayName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }

  if (email) {
    const localPart = email.split("@")[0] ?? "";
    const emailParts = localPart
      .split(/[._-]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (emailParts.length >= 2) {
      return `${emailParts[0][0]}${emailParts[emailParts.length - 1][0]}`.toUpperCase();
    }

    if (emailParts.length === 1) {
      return emailParts[0][0]?.toUpperCase() ?? "U";
    }
  }

  if (nameParts.length === 1) {
    return nameParts[0][0]?.toUpperCase() ?? "U";
  }

  return "U";
}

export function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout, exitOrganizationContext } = useAuth();
  const { getAvailableMenu, role } = usePermissions();
  const menu = getAvailableMenu();
  const primaryRole = getPrimaryRoleFromSession(session);
  const isSuperUser = primaryRole === "SUPER_USER";
  const hasActiveOrganizationContext = Boolean(session?.activeOrganizationId);
  const theme = useTheme();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [isExitingOrganizationContext, setIsExitingOrganizationContext] =
    useState(false);
  const displayName = getDisplayName(
    session?.firstName,
    session?.lastName,
    session?.email,
  );
  const initials = getInitials(
    session?.firstName,
    session?.lastName,
    displayName,
    session?.email,
  );
  const activeRole = role?.replaceAll("_", " ") ?? "N/D";
  const activeOrganizationLogoSrc = session?.activeOrganizationLogo
    ? session.activeOrganizationLogo.startsWith("data:")
      ? session.activeOrganizationLogo
      : `data:image/png;base64,${session.activeOrganizationLogo}`
    : undefined;
  const shellTitle = hasActiveOrganizationContext
    ? (session?.activeOrganizationName ?? "Organizzazione attiva")
    : "GZA Public Assistance";
  const shellSubtitle = hasActiveOrganizationContext
    ? "GZA Public Assistance"
    : null;
  const sessionExpiry = session?.expiresAtUtc
    ? new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(session.expiresAtUtc))
    : "N/D";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedMode = window.localStorage.getItem(shellPreferenceKey);
    if (savedMode === "hidden") {
      setIsSidebarVisible(false);
      setIsSidebarPinned(false);
      return;
    }

    if (savedMode === "floating") {
      setIsSidebarVisible(true);
      setIsSidebarPinned(false);
      return;
    }

    setIsSidebarVisible(true);
    setIsSidebarPinned(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextMode = !isSidebarVisible
      ? "hidden"
      : isSidebarPinned
        ? "pinned"
        : "floating";
    window.localStorage.setItem(shellPreferenceKey, nextMode);
  }, [isSidebarPinned, isSidebarVisible]);

  const isMenuItemSelected = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  const sidebarTakesLayoutSpace = isSidebarVisible && isSidebarPinned;
  const topbarIconButtonSx = {
    color: "var(--accent-secondary)",
    borderRadius: 1.5,
    border: "1px solid rgba(15, 109, 122, 0.32)",
    backgroundColor: "rgba(15, 109, 122, 0.04)",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(15, 109, 122, 0.16)",
      borderColor: "rgba(15, 109, 122, 0.5)",
    },
    "&:focus-visible": {
      outline: "2px solid rgba(15, 109, 122, 0.4)",
      outlineOffset: 1,
    },
  };

  const handleExitOrganizationFromToolbar = async () => {
    if (!isSuperUser || !hasActiveOrganizationContext) {
      return;
    }

    setIsExitingOrganizationContext(true);
    try {
      await exitOrganizationContext();
      router.replace("/organizations");
    } finally {
      setIsExitingOrganizationContext(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: "0 6px 24px rgba(8, 19, 31, 0.06)",
          zIndex: theme.zIndex.drawer + 2,
        }}
      >
        <Toolbar
          sx={{
            minHeight: 72,
            px: { xs: 2, md: 3 },
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
            <IconButton
              size="small"
              onClick={() => setIsSidebarVisible((current) => !current)}
              sx={topbarIconButtonSx}
              aria-label={
                isSidebarVisible ? "Nascondi navigazione" : "Mostra navigazione"
              }
            >
              <MenuOpen
                sx={{
                  fontSize: 20,
                  transform: isSidebarVisible
                    ? "rotate(0deg)"
                    : "rotate(180deg)",
                  transition: "transform 180ms ease",
                }}
              />
            </IconButton>
            {isSidebarVisible ? (
              <IconButton
                size="small"
                onClick={() => setIsSidebarPinned((current) => !current)}
                sx={{
                  ...topbarIconButtonSx,
                  color: isSidebarPinned
                    ? "var(--accent-secondary)"
                    : "#4f5f6f",
                  backgroundColor: isSidebarPinned
                    ? "rgba(15, 109, 122, 0.1)"
                    : "rgba(15, 109, 122, 0.03)",
                }}
                aria-label={
                  isSidebarPinned
                    ? "Disattiva barra fissa"
                    : "Attiva barra fissa"
                }
              >
                {isSidebarPinned ? (
                  <PushPin sx={{ fontSize: 18 }} />
                ) : (
                  <PushPinOutlined sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            ) : null}
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: hasActiveOrganizationContext ? 56 : 44,
                height: hasActiveOrganizationContext ? 56 : 44,
                borderRadius: 2,
                backgroundColor: hasActiveOrganizationContext
                  ? "rgba(15, 109, 122, 0.08)"
                  : "var(--accent)",
                border: hasActiveOrganizationContext
                  ? "1px solid rgba(15, 109, 122, 0.18)"
                  : "none",
                color: hasActiveOrganizationContext
                  ? "var(--accent-secondary)"
                  : "#ffffff",
                boxShadow: hasActiveOrganizationContext
                  ? "0 8px 20px rgba(8, 19, 31, 0.08)"
                  : "0 8px 20px rgba(217, 95, 67, 0.35)",
                overflow: "hidden",
              }}
            >
              {hasActiveOrganizationContext ? (
                <Avatar
                  src={activeOrganizationLogoSrc}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: "transparent",
                    color: "var(--accent-secondary)",
                    fontWeight: 800,
                    fontSize: 20,
                  }}
                >
                  {(session?.activeOrganizationName ?? "O")
                    .trim()[0]
                    ?.toUpperCase() ?? "O"}
                </Avatar>
              ) : (
                <VolunteerActivism fontSize="small" />
              )}
            </Box>
            <Box sx={{ minWidth: 0, display: "grid", gap: 0.25 }}>
              <Typography
                variant={
                  hasActiveOrganizationContext ? "body1" : "sectionEyebrow"
                }
                sx={{
                  lineHeight: 1.1,
                  color: hasActiveOrganizationContext
                    ? "var(--accent-secondary)"
                    : undefined,
                  fontWeight: hasActiveOrganizationContext ? 900 : undefined,
                  letterSpacing: hasActiveOrganizationContext
                    ? "0.01em"
                    : undefined,
                }}
                noWrap
              >
                {shellTitle}
              </Typography>
              {shellSubtitle ? (
                <Typography
                  variant="bodySmall"
                  sx={{
                    color: "var(--accent)",
                    lineHeight: 1.1,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                  noWrap
                >
                  {shellSubtitle}
                </Typography>
              ) : null}
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {isSuperUser && hasActiveOrganizationContext ? (
              <Button
                variant="contained"
                startIcon={<Apartment />}
                sx={{
                  bgcolor: "var(--accent-secondary)",
                  color: "#ffffff",
                  border: "1px solid rgba(15, 109, 122, 0.4)",
                  fontWeight: 800,
                  textTransform: "none",
                  boxShadow: "0 8px 20px rgba(15, 109, 122, 0.26)",
                  "&:hover": {
                    bgcolor: "#0b5c66",
                  },
                }}
                disabled={isExitingOrganizationContext}
                onClick={() => {
                  void handleExitOrganizationFromToolbar();
                }}
              >
                {isExitingOrganizationContext
                  ? "Uscita in corso..."
                  : "Esci organizzazione"}
              </Button>
            ) : null}

            <UserStatusMenu
              displayName={displayName}
              initials={initials}
              email={session?.email}
              sessionExpiry={sessionExpiry}
              activeRole={activeRole}
              isSuperUser={isSuperUser}
              hasActiveOrganizationContext={hasActiveOrganizationContext}
              onChangePassword={() => {
                router.replace(
                  `/change-password?mode=optional&returnTo=${encodeURIComponent(pathname)}`,
                );
              }}
              onEnterOrganization={() => {
                router.replace("/organizations");
              }}
              onLogout={async () => {
                await logout();
                router.replace("/login");
              }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", minHeight: "100vh", pt: "72px" }}>
        {isSidebarVisible ? (
          <Drawer
            variant="permanent"
            open
            sx={{
              width: {
                xs: 0,
                md: sidebarTakesLayoutSpace ? drawerWidth : 0,
              },
              flexShrink: 0,
              transition: "width 220ms ease",
              [`& .MuiDrawer-paper`]: {
                width: drawerWidth,
                boxSizing: "border-box",
                top: 72,
                height: "calc(100% - 72px)",
                background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, #f0ebe1 100%)`,
                borderRight: `1px solid ${theme.palette.divider}`,
                pt: 1.5,
                boxShadow: "8px 0 26px rgba(8, 19, 31, 0.08)",
                overflowX: "hidden",
                transition: "transform 220ms ease",
                transform: isSidebarPinned
                  ? "translateX(0)"
                  : {
                      xs: "translateX(0)",
                      md: "translateX(calc(-100% + 14px))",
                    },
                "&:hover, &:focus-within": {
                  transform: "translateX(0)",
                },
              },
            }}
          >
            <List sx={{ mt: 1 }}>
              {menu.map((item) => (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    href={item.path}
                    selected={isMenuItemSelected(item.path)}
                    sx={{
                      borderRadius: 1.5,
                      mb: 0.4,
                      fontWeight: 600,
                      mx: 1.2,
                      minHeight: 46,
                      backgroundColor: isMenuItemSelected(item.path)
                        ? "rgba(15, 109, 122, 0.2)"
                        : undefined,
                      color: isMenuItemSelected(item.path)
                        ? "#0b3f46"
                        : theme.palette.text.primary,
                      transition:
                        "background-color 0.2s ease, transform 0.2s ease",
                      "&:hover": {
                        backgroundColor: isMenuItemSelected(item.path)
                          ? "rgba(15, 109, 122, 0.28)"
                          : "rgba(15, 109, 122, 0.18)",
                        transform: "translateX(2px)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isMenuItemSelected(item.path)
                          ? "#0b3f46"
                          : "var(--accent-secondary)",
                      }}
                    >
                      {item.iconKey ? menuIcons[item.iconKey] : undefined}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: isMenuItemSelected(item.path) ? 700 : 600,
                        fontSize: 16,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Drawer>
        ) : null}

        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            p: { xs: 2, md: 4 },
            pl: { xs: 2, md: 3 },
            width: "100%",
            transition: "all 220ms ease",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
