"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Add,
  Business,
  DeleteOutline,
  Edit,
  FileDownload,
} from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRowParams,
} from "@mui/x-data-grid";
import { getProblemMessage } from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import {
  createClient,
  deleteClient,
  searchClients,
  updateClient,
} from "@/features/clients/api/clients-api";
import type { Client, ClientFormData } from "@/features/clients/api/types";
import { ClientFormDialog } from "@/features/clients/components/client-form-dialog";
import { useExcelExport } from "@/shared/hooks/use-excel-export";
import { useServerGridState } from "@/shared/hooks/use-server-grid-state";
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

function toClientSortField(field: string | undefined) {
  if (!field) {
    return undefined;
  }

  const sortFieldMap: Record<string, string> = {
    createdAt: "CreatedAt",
    fullName: "FullName",
    phone: "Phone",
    address: "Address",
    city: "City",
    province: "Province",
    notes: "Notes",
  };

  return sortFieldMap[field] ?? field;
}

export function ClientsWorkspace() {
  const { exportRowsToExcel } = useExcelExport();
  const { session } = useAuth();
  const scopedOrganizationId =
    session?.activeOrganizationId ??
    session?.memberships?.[0]?.organizationId ??
    undefined;
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
  const [data, setData] = useState<Client[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const gridColumns = useMemo<GridColDef<Client>[]>(
    () => [
      {
        field: "fullName",
        headerName: "Cliente",
        flex: 1,
        minWidth: 220,
        valueGetter: (_, row) => row.fullName || "-",
      },
      {
        field: "phone",
        headerName: "Telefono",
        flex: 0.8,
        minWidth: 150,
        valueGetter: (_, row) => row.phone || "-",
      },
      {
        field: "address",
        headerName: "Indirizzo",
        flex: 1,
        minWidth: 220,
        valueGetter: (_, row) => row.address || "-",
      },
      {
        field: "city",
        headerName: "Citta",
        flex: 0.8,
        minWidth: 150,
        valueGetter: (_, row) => row.city || "-",
      },
      {
        field: "province",
        headerName: "Provincia",
        flex: 0.7,
        minWidth: 130,
        valueGetter: (_, row) => row.province || "-",
      },
      {
        field: "notes",
        headerName: "Note",
        flex: 1.2,
        minWidth: 220,
        valueGetter: (_, row) => row.notes || "-",
      },
    ],
    [],
  );

  const selectedRow = useMemo(
    () => data.find((item) => item.id === selectedClientId) ?? null,
    [data, selectedClientId],
  );

  const selectedFormValues = useMemo<ClientFormData | undefined>(
    () =>
      selectedRow
        ? {
            organizationId: selectedRow.organizationId,
            firstName: selectedRow.firstName ?? "",
            lastName: selectedRow.lastName ?? "",
            phone: selectedRow.phone ?? "",
            address: selectedRow.address ?? "",
            city: selectedRow.city ?? "",
            province: selectedRow.province ?? "",
            notes: selectedRow.notes ?? "",
          }
        : undefined,
    [selectedRow],
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    let isDisposed = false;
    const loadClients = async () => {
      setIsLoading(true);
      setListError(null);

      try {
        if (!scopedOrganizationId) {
          setData([]);
          setTotalCount(0);
          setListError("Contesto organizzazione non disponibile.");
          return;
        }

        const sort = sortModel[0];
        const response = await searchClients({
          pageIndex: paginationModel.page,
          pageSize: paginationModel.pageSize,
          searchText: debouncedSearchText || undefined,
          sortBy: toClientSortField(sort?.field),
          sortDescending: sort?.sort === "desc",
          organizationId: scopedOrganizationId,
        });

        if (!isDisposed) {
          setData(response.items);
          setTotalCount(response.totalCount);
          if (
            selectedClientId &&
            !response.items.some((item) => item.id === selectedClientId)
          ) {
            setSelectedClientId(null);
          }
        }
      } catch (error) {
        if (!isDisposed) {
          const message =
            error instanceof Error
              ? getProblemMessage((error as { problem?: never }).problem)
              : "Caricamento non riuscito.";
          setListError(message);
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    void loadClients();

    return () => {
      isDisposed = true;
    };
  }, [
    debouncedSearchText,
    paginationModel.page,
    paginationModel.pageSize,
    reloadKey,
    scopedOrganizationId,
    selectedClientId,
    session,
    sortModel,
  ]);

  if (!session) {
    return <LoadingState message="Inizializzazione workspace Clients..." />;
  }

  const canEditOrDelete = Boolean(selectedClientId && selectedRow);

  const handleCreate = async (values: ClientFormData) => {
    if (!scopedOrganizationId) {
      return;
    }

    const created = await createClient({
      ...values,
      organizationId: scopedOrganizationId,
    });
    setReloadKey((current) => current + 1);
    setSelectedClientId(created.id);
  };

  const handleEdit = async (values: ClientFormData) => {
    if (!selectedClientId || !scopedOrganizationId) {
      return;
    }

    await updateClient(selectedClientId, {
      ...values,
      organizationId: scopedOrganizationId,
    });
    setReloadKey((current) => current + 1);
  };

  const handleDelete = async () => {
    if (!selectedClientId) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteClient(selectedClientId);
      setSelectedClientId(null);
      setIsDeleteDialogOpen(false);
      setReloadKey((current) => current + 1);
    } catch (error) {
      const message =
        error instanceof Error
          ? getProblemMessage((error as { problem?: never }).problem)
          : "Eliminazione non riuscita.";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <ContentCard className="overflow-hidden p-2 md:p-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Box sx={workspaceHeaderIconSx}>
              <Business sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="sectionEyebrow" sx={{ fontSize: 13 }}>
              Clienti
            </Typography>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownload />}
              sx={{ minHeight: 34, px: 1.35 }}
              onClick={() => exportRowsToExcel(data, gridColumns, "clienti")}
            >
              Export Excel
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
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Nuovo
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
              onClick={() => setIsEditDialogOpen(true)}
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
              onClick={() => setIsDeleteDialogOpen(true)}
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
            searchPlaceholder="Cerca cliente per nome, telefono, citta o provincia"
            onSearchTextChange={setSearchText}
          />

          {listError ? (
            <ErrorState
              title="Ricerca clienti non riuscita."
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
                  return params.row.id === selectedClientId
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
                onRowClick={(params: GridRowParams<Client>) =>
                  setSelectedClientId((current) =>
                    current === params.row.id ? null : params.row.id,
                  )
                }
                sx={organizationsEnterpriseDataGridSx}
              />
            </div>
          )}
        </Stack>
      </ContentCard>

      <ClientFormDialog
        open={isCreateDialogOpen}
        mode="create"
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreate}
      />

      <ClientFormDialog
        open={isEditDialogOpen}
        mode="edit"
        initialValues={selectedFormValues}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEdit}
      />

      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        title="Eliminare cliente"
        description={`Il cliente ${selectedRow?.fullName ?? "selezionato"} verra rimosso definitivamente.`}
        confirmLabel="Elimina cliente"
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        isConfirming={isDeleting}
        errorMessage={deleteError}
      />
    </Stack>
  );
}
