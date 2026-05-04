"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Add,
  Apartment,
  DeleteOutline,
  Edit,
  FileDownload,
} from "@mui/icons-material";
import { Avatar, Box, Button, Chip, Stack, Typography } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRowParams,
} from "@mui/x-data-grid";
import { getErrorMessage } from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import {
  useConfirmActionState,
  useDialogState,
} from "@/shared/hooks/use-dialog-confirm-state";
import { useServerGridState } from "@/shared/hooks/use-server-grid-state";
import {
  createOrganization,
  deleteOrganization,
  searchOrganizations,
  toOrganizationActiveFilter,
  updateOrganization,
} from "@/features/organizations/api/organizations-api";
import { useExcelExport } from "@/shared/hooks/use-excel-export";
import type {
  Organization,
  OrganizationFormData,
  OrganizationStatusFilter,
} from "@/features/organizations/api/types";
import { ConfirmActionDialog } from "@/shared/ui/confirm-action-dialog";
import { ContentCard } from "@/shared/ui/content-card";
import {
  getWorkspaceGridRowClassName,
  organizationsEnterpriseDataGridSx,
} from "@/shared/ui/data-grid/workspace-data-grid-styles";
import { ErrorState, LoadingState } from "@/shared/ui/feedback-states";
import { SearchToolbar } from "@/shared/ui/search-toolbar";
import {
  workspaceHeaderIconSx,
  workspacePrimaryActionButtonSx,
} from "@/shared/ui/workspace-styles";
import { OrganizationFormDialog } from "./organization-form-dialog";

const statusOptions = [
  { value: "all", label: "Tutte" },
  { value: "active", label: "Attive" },
  { value: "inactive", label: "Non attive" },
] as const;

function toLogoSrc(logo: string | null) {
  if (!logo) {
    return null;
  }

  if (logo.startsWith("data:")) {
    return logo;
  }

  return `data:image/png;base64,${logo}`;
}

function getNameInitial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? "O";
}

export function OrganizationsWorkspace() {
  const { exportRowsToExcel } = useExcelExport();
  const router = useRouter();
  const { session, enterOrganizationContext } = useAuth();
  const {
    searchText,
    debouncedSearchText,
    paginationModel,
    sortModel,
    setSearchText,
    setPaginationModel,
    handlePaginationModelChange,
    handleSortModelChange,
  } = useServerGridState();
  const [statusFilter, setStatusFilter] =
    useState<OrganizationStatusFilter>("all");
  const [data, setData] = useState<Organization[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(null);
  const [reloadKey, setReloadKey] = useState(0);
  const createDialog = useDialogState(false);
  const editDialog = useDialogState(false);
  const deleteDialog = useConfirmActionState();
  const [isEnteringOrganizationContext, setIsEnteringOrganizationContext] =
    useState(false);

  const handleRowClick = (params: GridRowParams<Organization>) => {
    setSelectedOrganizationId((current) =>
      current === params.row.id ? null : params.row.id,
    );
  };

  const gridColumns = useMemo<GridColDef<Organization>[]>(
    () => [
      {
        field: "logo",
        headerName: "Logo",
        width: 92,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "center",
        renderCell: (params) => {
          const logoSrc = toLogoSrc(params.row.logo);

          return (
            <Avatar
              alt={params.row.name}
              src={logoSrc ?? undefined}
              sx={{
                width: 34,
                height: 34,
                bgcolor: "var(--accent-secondary)",
                color: "#ffffff",
                fontWeight: 700,
              }}
            >
              {getNameInitial(params.row.name)}
            </Avatar>
          );
        },
      },
      {
        field: "name",
        headerName: "Organizzazione",
        flex: 1.2,
        minWidth: 220,
      },
      {
        field: "city",
        headerName: "Citta",
        flex: 0.8,
        minWidth: 140,
        sortable: false,
        valueGetter: (_, row) => row.city || "-",
      },
      {
        field: "region",
        headerName: "Regione",
        flex: 0.8,
        minWidth: 140,
        valueGetter: (_, row) => row.region || "-",
      },
      {
        field: "vatNumber",
        headerName: "Partita IVA",
        flex: 0.9,
        minWidth: 150,
        sortable: false,
        valueGetter: (_, row) => row.vatNumber || "-",
      },
      {
        field: "isActive",
        headerName: "Stato",
        flex: 0.6,
        minWidth: 130,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value ? "Attiva" : "Non attiva"}
            color={params.value ? "success" : "default"}
            variant={params.value ? "filled" : "outlined"}
          />
        ),
      },
    ],
    [],
  );

  const selectedRow = useMemo(
    () => data.find((item) => item.id === selectedOrganizationId) ?? null,
    [data, selectedOrganizationId],
  );

  useEffect(() => {
    if (!selectedOrganizationId) {
      return;
    }

    if (!data.some((item) => item.id === selectedOrganizationId)) {
      setSelectedOrganizationId(null);
    }
  }, [data, selectedOrganizationId]);

  const selectedOrganizationFormValues = useMemo<
    OrganizationFormData | undefined
  >(
    () =>
      selectedRow
        ? {
            name: selectedRow.name,
            logo: selectedRow.logo ?? "",
            vatNumber: selectedRow.vatNumber,
            address: selectedRow.address,
            city: selectedRow.city,
            region: selectedRow.region,
            isActive: selectedRow.isActive,
          }
        : undefined,
    [selectedRow],
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    let isDisposed = false;
    const loadOrganizations = async () => {
      setIsLoading(true);
      setListError(null);

      try {
        const sort = sortModel[0];
        const response = await searchOrganizations({
          pageIndex: paginationModel.page,
          pageSize: paginationModel.pageSize,
          searchText: debouncedSearchText || undefined,
          sortBy: sort?.field,
          sortDescending: sort?.sort === "desc",
          isActive: toOrganizationActiveFilter(statusFilter),
        });

        if (!isDisposed) {
          setData(response.items);
          setTotalCount(response.totalCount);
        }
      } catch (error) {
        if (!isDisposed) {
          const message = getErrorMessage(error, "Caricamento non riuscito.");
          setListError(message);
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    void loadOrganizations();

    return () => {
      isDisposed = true;
    };
  }, [
    debouncedSearchText,
    paginationModel.page,
    paginationModel.pageSize,
    reloadKey,
    session,
    sortModel,
    statusFilter,
  ]);

  if (!session) {
    return (
      <LoadingState message="Inizializzazione workspace Organizations..." />
    );
  }

  const selectedOrganizationName =
    selectedRow?.name ?? "organizzazione selezionata";
  const canEditOrDelete = Boolean(selectedOrganizationId && selectedRow);
  const canEnterOrganizationContext = Boolean(selectedOrganizationId);

  const handleEnterOrganization = async () => {
    if (!selectedOrganizationId) {
      return;
    }

    setIsEnteringOrganizationContext(true);
    setListError(null);

    try {
      await enterOrganizationContext(selectedOrganizationId);
      router.replace("/dashboard");
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Attivazione contesto organizzazione non riuscita.",
      );
      setListError(message);
      setIsEnteringOrganizationContext(false);
    }
  };

  const handleCreateOrganization = async (values: OrganizationFormData) => {
    if (!session) {
      return;
    }

    const created = await createOrganization(values);
    setReloadKey((current) => current + 1);
    setSelectedOrganizationId(created.id);
  };

  const handleEditOrganization = async (values: OrganizationFormData) => {
    if (!session || !selectedOrganizationId) {
      return;
    }

    await updateOrganization(selectedOrganizationId, values);
    setReloadKey((current) => current + 1);
  };

  const handleDeleteOrganization = async () => {
    if (!session || !selectedOrganizationId) {
      return;
    }

    await deleteDialog.run(async () => {
      await deleteOrganization(selectedOrganizationId);
      setSelectedOrganizationId(null);
      setReloadKey((current) => current + 1);
    }, "Eliminazione non riuscita.");
  };

  return (
    <Stack spacing={2.5}>
      <ContentCard className="overflow-hidden p-2 md:p-2.5">
        <div className="flex flex-col  md:flex-row md:items-center md:justify-between ">
          <div className="flex min-w-0 items-center gap-3">
            <Box sx={workspaceHeaderIconSx}>
              <Apartment sx={{ fontSize: 18 }} />
            </Box>
            <div className="flex min-w-0 flex-col ">
              <Typography
                variant="sectionEyebrow"
                sx={{
                  fontSize: 13,
                }}
              >
                Organizzazioni
              </Typography>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownload />}
              sx={{ minHeight: 34, px: 1.35 }}
              onClick={() => exportRowsToExcel(data, gridColumns, "organizzazioni")}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Apartment />}
              disabled={
                !canEnterOrganizationContext || isEnteringOrganizationContext
              }
              sx={{ minHeight: 34, px: 1.35 }}
              onClick={handleEnterOrganization}
            >
              {isEnteringOrganizationContext
                ? "Accesso in corso..."
                : "Esplora organizzazione"}
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              sx={{
                ...workspacePrimaryActionButtonSx,
                minHeight: 34,
                px: 1.35,
              }}
              onClick={createDialog.open}
            >
              Nuova
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Edit />}
              disabled={!canEditOrDelete}
              sx={{
                ...workspacePrimaryActionButtonSx,
                minHeight: 34,
                px: 1.35,
              }}
              onClick={editDialog.open}
            >
              Modifica
            </Button>
            <Button
              variant="contained"
              size="small"
              color="error"
              startIcon={<DeleteOutline />}
              disabled={!canEditOrDelete}
              sx={{ minHeight: 34, px: 1.35 }}
              onClick={deleteDialog.open}
            >
              Elimina
            </Button>
          </div>
        </div>
      </ContentCard>

      <ContentCard className="p-2 md:p-2.5">
        <Stack spacing={3}>
          <SearchToolbar
            searchText={searchText}
            searchPlaceholder="Cerca organizzazione, città o partita IVA"
            onSearchTextChange={setSearchText}
            filters={[
              {
                key: "status",
                label: "Stato",
                value: statusFilter,
                options: [...statusOptions],
                onChange: (value) => {
                  setStatusFilter(value as OrganizationStatusFilter);
                  setPaginationModel((current) => ({ ...current, page: 0 }));
                },
              },
            ]}
          />
          {listError ? (
            <ErrorState
              title="Ricerca organizzazioni non riuscita."
              description={listError}
              onRetry={() => setPaginationModel((current) => ({ ...current }))}
            />
          ) : (
            <div className="min-h-[560px]">
              <DataGrid
                rows={data}
                columns={gridColumns}
                getRowId={(row) => row.id}
                hideFooterSelectedRowCount
                getRowClassName={(params) => {
                  const rowClassName = getWorkspaceGridRowClassName(params);
                  return params.row.id === selectedOrganizationId
                    ? `${rowClassName} workspace-row-selected`
                    : rowClassName;
                }}
                paginationMode="server"
                sortingMode="server"
                rowCount={totalCount}
                pageSizeOptions={[10, 20, 50]}
                paginationModel={paginationModel}
                onPaginationModelChange={handlePaginationModelChange}
                sortModel={sortModel}
                onSortModelChange={handleSortModelChange}
                loading={isLoading}
                disableRowSelectionOnClick
                onRowClick={handleRowClick}
                sx={organizationsEnterpriseDataGridSx}
              />
            </div>
          )}
        </Stack>
      </ContentCard>

      <OrganizationFormDialog
        open={createDialog.isOpen}
        onClose={createDialog.close}
        onSubmit={handleCreateOrganization}
      />

      <OrganizationFormDialog
        open={editDialog.isOpen}
        initialValues={selectedOrganizationFormValues}
        onClose={editDialog.close}
        onSubmit={handleEditOrganization}
      />

      <ConfirmActionDialog
        open={deleteDialog.isOpen}
        title="Eliminare organizzazione"
        description={`L'organizzazione ${selectedOrganizationName} verra rimossa definitivamente.`}
        confirmLabel="Elimina organizzazione"
        onClose={() => {
          if (!deleteDialog.isSubmitting) {
            deleteDialog.close();
          }
        }}
        onConfirm={handleDeleteOrganization}
        isConfirming={deleteDialog.isSubmitting}
        errorMessage={deleteDialog.errorMessage}
      />
    </Stack>
  );
}
