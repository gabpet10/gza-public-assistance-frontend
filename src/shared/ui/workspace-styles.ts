import type { SxProps, Theme } from "@mui/material/styles";

export const workspaceHeaderIconSx: SxProps<Theme> = {
  width: { xs: 34, md: 36 },
  height: { xs: 34, md: 36 },
  borderRadius: 1.5,
  display: "grid",
  placeItems: "center",
  backgroundColor: "var(--accent-secondary)",
  color: "#ffffff",
  boxShadow: "0 6px 14px rgba(30, 143, 166, 0.22)",
};

export const workspacePrimaryActionButtonSx: SxProps<Theme> = {
  backgroundColor: "var(--accent-secondary)",
  color: "#ffffff",
  minHeight: 34,
  paddingInline: 10,
  fontSize: "0.82rem",
  "&:hover": {
    backgroundColor: "#197a8e",
  },
};

export const workspaceCompactPrimaryActionButtonSx: SxProps<Theme> = {
  ...workspacePrimaryActionButtonSx,
  minHeight: 34,
  px: 1.35,
};

export const workspaceCompactSecondaryActionButtonSx: SxProps<Theme> = {
  minHeight: 34,
  px: 1.35,
  fontSize: "0.82rem",
};

export const workspaceViewToggleGroupSx: SxProps<Theme> = {
  border: "1px solid rgba(30, 143, 166, 0.42)",
  borderRadius: 1,
  overflow: "hidden",
  "& .MuiToggleButton-root": {
    color: "#1f2937",
    borderColor: "rgba(30, 143, 166, 0.32)",
    fontWeight: 600,
    textTransform: "none",
    minHeight: 34,
    px: 1.2,
    fontSize: "0.82rem",
  },
  "& .MuiToggleButton-root.Mui-selected": {
    backgroundColor: "var(--accent-secondary)",
    color: "#ffffff",
    fontWeight: 700,
  },
  "& .MuiToggleButton-root.Mui-selected:hover": {
    backgroundColor: "#197a8e",
  },
  "& .MuiToggleButton-root:not(.Mui-selected):hover": {
    backgroundColor: "rgba(30, 143, 166, 0.1)",
  },
};

export const workspaceDetailCloseButtonSx: SxProps<Theme> = {
  color: "var(--accent-secondary)",
  border: "1px solid var(--accent-secondary)",
  borderRadius: 2,
  "&:hover": {
    backgroundColor: "rgba(30, 143, 166, 0.1)",
  },
};
