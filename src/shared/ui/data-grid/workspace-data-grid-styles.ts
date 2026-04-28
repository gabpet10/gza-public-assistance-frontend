import type { SxProps, Theme } from "@mui/material/styles";
import type { GridRowClassNameParams } from "@mui/x-data-grid";

export const workspaceGridOverlayHeight = "280px";

export function getWorkspaceGridRowClassName(
  params: GridRowClassNameParams,
): string {
  return params.indexRelativeToCurrentPage % 2 === 0
    ? "workspace-row-even"
    : "workspace-row-odd";
}

export const workspaceDataGridSx: SxProps<Theme> = {
  border: "none",
  [`--DataGrid-overlayHeight`]: workspaceGridOverlayHeight,
  "& .MuiDataGrid-columnHeaders": {
    background:
      "linear-gradient(180deg, rgba(11,58,83,0.18) 0%, rgba(11,58,83,0.12) 100%)",
    borderBottom: "2px solid rgba(11, 58, 83, 0.28)",
    minHeight: 56,
  },
  "& .MuiDataGrid-columnHeader": {
    borderRight: "1px solid rgba(20, 32, 43, 0.08)",
    px: 1.25,
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: 800,
    color: "#14202b",
    letterSpacing: "0.03em",
    fontSize: "0.82rem",
    textTransform: "uppercase",
  },
  "& .workspace-row-even": {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
  },
  "& .workspace-row-odd": {
    backgroundColor: "rgba(11, 58, 83, 0.05)",
  },
  "& .MuiDataGrid-cell": {
    borderBottom: "1px solid rgba(20, 32, 43, 0.08)",
    py: 1.1,
    px: 1.25,
    lineHeight: 1.45,
  },
  "& .MuiDataGrid-row:hover": {
    backgroundColor: "rgba(30, 143, 166, 0.14)",
  },
  "& .workspace-row-selected": {
    backgroundColor: "rgba(30, 143, 166, 0.22)",
  },
  "& .workspace-row-selected:hover": {
    backgroundColor: "rgba(30, 143, 166, 0.28)",
  },
  "& .MuiDataGrid-row.Mui-selected": {
    backgroundColor: "rgba(30, 143, 166, 0.22)",
  },
  "& .MuiDataGrid-row.Mui-selected:hover": {
    backgroundColor: "rgba(30, 143, 166, 0.28)",
  },
  "& .MuiDataGrid-footerContainer": {
    minHeight: 60,
    background:
      "linear-gradient(180deg, rgba(11, 58, 83, 0.16) 0%, rgba(11, 58, 83, 0.22) 100%)",
    borderTop: "2px solid rgba(11, 58, 83, 0.34)",
  },
  "& .MuiTablePagination-root": {
    color: "#f3f7fb",
    fontWeight: 600,
  },
  "& .MuiTablePagination-selectIcon": {
    color: "#f3f7fb",
  },
  "& .MuiTablePagination-actions .MuiIconButton-root": {
    color: "#f3f7fb",
  },
};

export const organizationsEnterpriseDataGridSx: SxProps<Theme> = [
  workspaceDataGridSx,
  {
    border: "1px solid rgba(20, 32, 43, 0.12)",
    borderRadius: 1,
    boxShadow: "0 14px 32px rgba(11, 58, 83, 0.09)",
    backgroundColor: "#ffffff",
    overflow: "hidden",
    "& .MuiDataGrid-columnHeaders": {
      background:
        "linear-gradient(180deg, rgba(247,251,253,0.98) 0%, rgba(234,243,247,0.98) 100%)",
      borderBottom: "1px solid rgba(20, 32, 43, 0.2)",
      minHeight: 54,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    "& .MuiDataGrid-columnHeader": {
      borderRight: "1px solid rgba(20, 32, 43, 0.12)",
      px: 1.5,
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      textTransform: "none",
      letterSpacing: "0.01em",
      fontSize: "0.87rem",
      fontWeight: 700,
      color: "#173043",
    },
    "& .workspace-row-even": {
      backgroundColor: "#ffffff",
    },
    "& .workspace-row-odd": {
      backgroundColor: "#f6fafc",
    },
    "& .MuiDataGrid-cell": {
      borderBottom: "1px solid rgba(20, 32, 43, 0.1)",
      borderRight: "1px solid rgba(20, 32, 43, 0.07)",
      py: 1.15,
      px: 1.5,
      lineHeight: 1.45,
    },
    "& .MuiDataGrid-row:hover": {
      backgroundColor: "rgba(30, 143, 166, 0.1)",
    },
    "& .workspace-row-selected": {
      backgroundColor: "rgba(30, 143, 166, 0.16)",
    },
    "& .workspace-row-selected:hover": {
      backgroundColor: "rgba(30, 143, 166, 0.22)",
    },
    "& .MuiDataGrid-row.Mui-selected": {
      backgroundColor: "rgba(30, 143, 166, 0.16)",
    },
    "& .MuiDataGrid-row.Mui-selected:hover": {
      backgroundColor: "rgba(30, 143, 166, 0.22)",
    },
    "& .MuiDataGrid-footerContainer": {
      minHeight: 56,
      background: "#edf4f8",
      borderTop: "1px solid rgba(20, 32, 43, 0.16)",
    },
    "& .MuiTablePagination-root": {
      color: "#243547",
      fontWeight: 600,
    },
    "& .MuiTablePagination-selectIcon": {
      color: "#243547",
    },
    "& .MuiTablePagination-actions .MuiIconButton-root": {
      color: "#243547",
    },
  },
];

export const workspaceDetailActionButtonSx: SxProps<Theme> = {
  backgroundColor: "var(--accent-secondary)",
  color: "#ffffff",
  borderRadius: "50%",
  width: 28,
  height: 28,
  "&:hover": {
    backgroundColor: "#197a8e",
  },
};

export const workspaceDetailActionIconSx: SxProps<Theme> = {
  fontSize: 14,
};
