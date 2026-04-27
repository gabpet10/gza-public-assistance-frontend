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
      "linear-gradient(180deg, rgba(8,19,31,0.18) 0%, rgba(8,19,31,0.12) 100%)",
    borderBottom: "2px solid rgba(8, 19, 31, 0.26)",
    minHeight: 56,
  },
  "& .MuiDataGrid-columnHeader": {
    borderRight: "1px solid rgba(8, 19, 31, 0.08)",
    px: 1.25,
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: 800,
    color: "#08131f",
    letterSpacing: "0.03em",
    fontSize: "0.82rem",
    textTransform: "uppercase",
  },
  "& .workspace-row-even": {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
  },
  "& .workspace-row-odd": {
    backgroundColor: "rgba(8, 19, 31, 0.05)",
  },
  "& .MuiDataGrid-cell": {
    borderBottom: "1px solid rgba(8, 19, 31, 0.08)",
    py: 1.1,
    px: 1.25,
    lineHeight: 1.45,
  },
  "& .MuiDataGrid-row:hover": {
    backgroundColor: "rgba(15, 109, 122, 0.13)",
  },
  "& .workspace-row-selected": {
    backgroundColor: "rgba(15, 109, 122, 0.2)",
  },
  "& .workspace-row-selected:hover": {
    backgroundColor: "rgba(15, 109, 122, 0.25)",
  },
  "& .MuiDataGrid-row.Mui-selected": {
    backgroundColor: "rgba(15, 109, 122, 0.2)",
  },
  "& .MuiDataGrid-row.Mui-selected:hover": {
    backgroundColor: "rgba(15, 109, 122, 0.25)",
  },
  "& .MuiDataGrid-footerContainer": {
    minHeight: 60,
    background:
      "linear-gradient(180deg, rgba(8, 19, 31, 0.16) 0%, rgba(8, 19, 31, 0.22) 100%)",
    borderTop: "2px solid rgba(8, 19, 31, 0.35)",
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
    border: "1px solid rgba(8, 19, 31, 0.12)",
    borderRadius: 1,
    boxShadow: "0 14px 32px rgba(8, 19, 31, 0.09)",
    backgroundColor: "#ffffff",
    overflow: "hidden",
    "& .MuiDataGrid-columnHeaders": {
      background:
        "linear-gradient(180deg, rgba(243,247,251,0.96) 0%, rgba(231,238,245,0.96) 100%)",
      borderBottom: "1px solid rgba(8, 19, 31, 0.2)",
      minHeight: 54,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    "& .MuiDataGrid-columnHeader": {
      borderRight: "1px solid rgba(8, 19, 31, 0.12)",
      px: 1.5,
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      textTransform: "none",
      letterSpacing: "0.01em",
      fontSize: "0.87rem",
      fontWeight: 700,
      color: "#102235",
    },
    "& .workspace-row-even": {
      backgroundColor: "#ffffff",
    },
    "& .workspace-row-odd": {
      backgroundColor: "#f8fbfe",
    },
    "& .MuiDataGrid-cell": {
      borderBottom: "1px solid rgba(8, 19, 31, 0.1)",
      borderRight: "1px solid rgba(8, 19, 31, 0.07)",
      py: 1.15,
      px: 1.5,
      lineHeight: 1.45,
    },
    "& .MuiDataGrid-row:hover": {
      backgroundColor: "rgba(15, 109, 122, 0.1)",
    },
    "& .workspace-row-selected": {
      backgroundColor: "rgba(15, 109, 122, 0.16)",
    },
    "& .workspace-row-selected:hover": {
      backgroundColor: "rgba(15, 109, 122, 0.2)",
    },
    "& .MuiDataGrid-row.Mui-selected": {
      backgroundColor: "rgba(15, 109, 122, 0.16)",
    },
    "& .MuiDataGrid-row.Mui-selected:hover": {
      backgroundColor: "rgba(15, 109, 122, 0.2)",
    },
    "& .MuiDataGrid-footerContainer": {
      minHeight: 56,
      background: "#f3f7fb",
      borderTop: "1px solid rgba(8, 19, 31, 0.16)",
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
    backgroundColor: "#0c5b65",
  },
};

export const workspaceDetailActionIconSx: SxProps<Theme> = {
  fontSize: 14,
};
