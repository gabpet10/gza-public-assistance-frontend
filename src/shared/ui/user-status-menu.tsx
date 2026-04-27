"use client";

import { useState } from "react";
import { AccountCircle, Apartment, Logout } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useTheme,
} from "@mui/material";

type UserStatusMenuProps = Readonly<{
  displayName: string;
  initials: string;
  email: string | null | undefined;
  sessionExpiry: string;
  activeRole: string;
  isSuperUser: boolean;
  hasActiveOrganizationContext: boolean;
  onChangePassword: () => void;
  onEnterOrganization: () => void;
  onLogout: () => Promise<void>;
}>;

export function UserStatusMenu({
  displayName,
  initials,
  email,
  sessionExpiry,
  activeRole,
  isSuperUser,
  hasActiveOrganizationContext,
  onChangePassword,
  onEnterOrganization,
  onLogout,
}: UserStatusMenuProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(anchorEl);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const profileMenuItemSx = {
    minHeight: 46,
    justifyContent: "flex-start",
    color: theme.palette.text.primary,
    fontWeight: 700,
    borderRadius: 1,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(15, 109, 122, 0.12)",
      color: "var(--accent-secondary)",
    },
  };

  return (
    <>
      <IconButton onClick={handleUserMenuOpen} size="large">
        <Avatar
          sx={{
            bgcolor: "var(--accent)",
            color: "#ffffff",
            fontWeight: 800,
            letterSpacing: "0.04em",
          }}
        >
          {initials || <AccountCircle />}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={userMenuOpen}
        onClose={handleUserMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              minWidth: 360,
              p: 0,
              border: "2px solid rgba(8, 19, 31, 0.18)",
              boxShadow: "0 16px 44px rgba(8, 19, 31, 0.16)",
            },
          },
        }}
      >
        <Box sx={{ p: 2.75, pb: 3 }}>
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 1.5,
              background:
                "linear-gradient(145deg, rgba(217,95,67,0.16) 0%, rgba(15,109,122,0.12) 100%)",
              border: `1px solid ${theme.palette.divider}`,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: "var(--accent)",
                color: "#ffffff",
                fontWeight: 800,
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body1" fontWeight={900} noWrap>
                {displayName}
              </Typography>
              <Typography
                variant="bodySmall"
                sx={{ color: "text.secondary", mt: 0.25 }}
                noWrap
              >
                {email ?? "Email non disponibile"}
              </Typography>
            </Box>
          </Box>
          <Divider />
          <Box sx={{ mt: 1.75, display: "grid", gap: 0.9 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography variant="bodySmall" sx={{ color: "text.secondary" }}>
                Stato sessione
              </Typography>
              <Typography variant="bodySmall" fontWeight={700}>
                Attiva
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography variant="bodySmall" sx={{ color: "text.secondary" }}>
                Scadenza
              </Typography>
              <Typography variant="bodySmall" fontWeight={700}>
                {sessionExpiry}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography variant="bodySmall" sx={{ color: "text.secondary" }}>
                Ruolo
              </Typography>
              <Typography variant="bodySmall" fontWeight={700}>
                {activeRole}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            p: 0.75,
            gap: 0.75,
          }}
        >
          <MenuItem
            onClick={() => {
              handleUserMenuClose();
              onChangePassword();
            }}
            sx={profileMenuItemSx}
          >
            <AccountCircle sx={{ mr: 1 }} /> Cambia password
          </MenuItem>

          {isSuperUser && !hasActiveOrganizationContext ? (
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                onEnterOrganization();
              }}
              sx={profileMenuItemSx}
            >
              <Apartment sx={{ mr: 1 }} /> Entra in organizzazione
            </MenuItem>
          ) : null}

          <MenuItem
            onClick={async () => {
              handleUserMenuClose();
              await onLogout();
            }}
            sx={profileMenuItemSx}
          >
            <Logout sx={{ mr: 1 }} /> Esci
          </MenuItem>
        </Box>
      </Menu>
    </>
  );
}
