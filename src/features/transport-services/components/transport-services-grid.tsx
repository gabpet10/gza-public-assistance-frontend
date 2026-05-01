import {
  AccessibilityNew,
  AssignmentInd,
  Diversity3,
  Healing,
  LocalHospital,
  MedicalInformation,
  SwapHoriz,
  VisibilityOutlined,
} from "@mui/icons-material";
import { Chip } from "@mui/material";
import { IconButton, Stack, Tooltip } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRowParams,
} from "@mui/x-data-grid";
import type { GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import type { TransportService } from "@/features/transport-services/api/types";
import {
  getTransportStatusChipSx,
  getTransportStatusLabel,
  getTransportTypeLabel,
} from "@/features/transport-services/components/transport-service-status-ui";
import {
  getWorkspaceGridRowClassName,
  organizationsEnterpriseDataGridSx,
  workspaceDetailActionButtonSx,
  workspaceDetailActionIconSx,
} from "@/shared/ui/data-grid/workspace-data-grid-styles";

type TransportServicesGridProps = {
  rows: TransportService[];
  isLoading: boolean;
  totalCount: number;
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;
  selectedId: string | null;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onSortModelChange: (model: GridSortModel) => void;
  onRowClick: (params: GridRowParams<TransportService>) => void;
  onOpenDetail: (serviceId: string) => void;
};

function getDriverDisplayName(row: TransportService): string | null {
  const driverFromVolunteers = row.volunteers.find(
    (volunteer) => volunteer.role === "driver",
  );
  if (driverFromVolunteers?.fullName?.trim()) {
    return driverFromVolunteers.fullName;
  }

  if (row.volunteers.length > 0 && row.volunteers[0].fullName?.trim()) {
    return row.volunteers[0].fullName;
  }

  if (row.assignedVolunteerNames.length > 0) {
    const firstName = row.assignedVolunteerNames[0]?.trim();
    return firstName || null;
  }

  return null;
}

function formatAmount(value: number | null) {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function getTransportTypeIcon(
  transportType: TransportService["transportType"],
) {
  const iconSx = { fontSize: 16, color: "var(--accent-secondary)" };

  if (transportType === "sanitario") {
    return <LocalHospital sx={iconSx} />;
  }

  if (transportType === "dimissione_ospedaliera") {
    return <Healing sx={iconSx} />;
  }

  if (transportType === "visita_programmata") {
    return <MedicalInformation sx={iconSx} />;
  }

  if (transportType === "dialisi") {
    return <LocalHospital sx={iconSx} />;
  }

  if (transportType === "riabilitazione") {
    return <AccessibilityNew sx={iconSx} />;
  }

  if (transportType === "trasferimento_struttura") {
    return <SwapHoriz sx={iconSx} />;
  }

  if (transportType === "accompagnamento_amministrativo") {
    return <AssignmentInd sx={iconSx} />;
  }

  return <Diversity3 sx={iconSx} />;
}

export function TransportServicesGrid({
  rows,
  isLoading,
  totalCount,
  paginationModel,
  sortModel,
  selectedId,
  onPaginationModelChange,
  onSortModelChange,
  onRowClick,
  onOpenDetail,
}: TransportServicesGridProps) {
  const columns: GridColDef<TransportService>[] = [
    {
      field: "actions",
      headerName: "Dettaglio",
      width: 84,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      renderCell: (params) => (
        <Tooltip title="Apri dettaglio">
          <IconButton
            size="small"
            sx={workspaceDetailActionButtonSx}
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetail(params.row.id);
            }}
          >
            <VisibilityOutlined sx={workspaceDetailActionIconSx} />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "clientDisplayName",
      headerName: "Cliente",
      flex: 1.2,
      minWidth: 220,
      valueGetter: (_, row) => row.clientDisplayName || row.clientId || "-",
    },
    {
      field: "pickupDestinationDisplayName",
      headerName: "Indirizzo",
      flex: 1,
      minWidth: 220,
      valueGetter: (_, row) =>
        [row.dropoffAddress, row.dropoffCity, row.dropoffProvince]
          .filter(Boolean)
          .join(", ") || "-",
    },
    {
      field: "status",
      headerName: "Stato",
      flex: 0.7,
      minWidth: 140,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          variant="outlined"
          label={getTransportStatusLabel(row.status)}
          sx={getTransportStatusChipSx(row.status)}
        />
      ),
    },
    {
      field: "transportType",
      headerName: "Tipologia",
      flex: 0.85,
      minWidth: 170,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.8} alignItems="center">
          {getTransportTypeIcon(row.transportType)}
          <span>{getTransportTypeLabel(row.transportType)}</span>
        </Stack>
      ),
    },
    {
      field: "scheduledAt",
      headerName: "Pianificato",
      flex: 0.9,
      minWidth: 180,
    },
    {
      field: "dropoffCity",
      headerName: "Destinazione",
      flex: 0.9,
      minWidth: 220,
      valueGetter: (_, row) =>
        row.pickupDestinationDisplayName || row.pickupDestinationId || "-",
    },
    {
      field: "vehicleDisplayName",
      headerName: "Veicolo",
      flex: 0.8,
      minWidth: 190,
      valueGetter: (_, row) => row.vehicleDisplayName || row.vehicleId || "-",
    },
    {
      field: "isPaid",
      headerName: "Pagamento",
      flex: 0.8,
      minWidth: 190,
      valueGetter: (_, row) => {
        if (!row.isPaid) {
          return "Non a pagamento";
        }

        return `A pagamento · ${formatAmount(row.amount)}`;
      },
    },
    {
      field: "teamMemberCount",
      headerName: "Volontari",
      flex: 0.7,
      minWidth: 220,
      align: "left",
      headerAlign: "left",
      valueGetter: (_, row) => {
        const volunteersCount = Math.max(
          row.volunteers.length,
          row.teamMemberCount,
          row.assignedVolunteerNames.length,
          row.assignedVolunteerIds.length,
        );
        const countLabel = String(volunteersCount);
        const driverDisplay = getDriverDisplayName(row);

        if (!driverDisplay) {
          return countLabel;
        }

        return `${countLabel} · Autista: ${driverDisplay}`;
      },
    },
  ];

  return (
    <div className="min-h-[560px]">
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        loading={isLoading}
        rowCount={totalCount}
        paginationMode="server"
        sortingMode="server"
        paginationModel={paginationModel}
        sortModel={sortModel}
        onPaginationModelChange={onPaginationModelChange}
        onSortModelChange={onSortModelChange}
        onRowClick={onRowClick}
        hideFooterSelectedRowCount
        getRowClassName={(params) => {
          const rowClassName = getWorkspaceGridRowClassName(params);
          return params.row.id === selectedId
            ? `${rowClassName} workspace-row-selected`
            : rowClassName;
        }}
        sx={organizationsEnterpriseDataGridSx}
      />
    </div>
  );
}
