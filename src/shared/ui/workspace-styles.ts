import type { SxProps, Theme } from "@mui/material/styles";

export const workspaceHeaderIconSx: SxProps<Theme> = {
  width: { xs: 42, md: 46 },
  height: { xs: 42, md: 46 },
  borderRadius: 2,
  display: "grid",
  placeItems: "center",
  backgroundColor: "var(--accent-secondary)",
  color: "#ffffff",
  boxShadow: "0 8px 18px rgba(30, 143, 166, 0.24)",
};

export const workspacePrimaryActionButtonSx: SxProps<Theme> = {
  backgroundColor: "var(--accent-secondary)",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#197a8e",
  },
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
    px: 1.5,
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
