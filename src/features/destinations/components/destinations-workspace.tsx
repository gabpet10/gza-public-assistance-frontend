"use client";

import { useEffect, useMemo, useState } from "react";
import { Add, DeleteOutline, Edit, Place } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRowParams,
  type GridSortModel,
} from "@mui/x-data-grid";
import { getProblemMessage } from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import {
  createDestination,
  deleteDestination,
  searchDestinations,
  updateDestination,
} from "@/features/destinations/api/destinations-api";
import type {
  Destination,
  DestinationFormData,
} from "@/features/destinations/api/types";
import { DestinationFormDialog } from "@/features/destinations/components/destination-form-dialog";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
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

function toDestinationSortField(field: string | undefined) {
  if (!field) {
    return undefined;
  }

  const sortFieldMap: Record<string, string> = {
    createdAt: "CreatedAt",
    name: "Name",
    description: "Description",
    address: "Address",
    city: "City",
    province: "Province",
    notes: "Notes",
  };

  return sortFieldMap[field] ?? field;
}

export function DestinationsWorkspace() {
  const { session } = useAuth();
  const scopedOrganizationId =
    session?.activeOrganizationId ??
    session?.memberships?.[0]?.organizationId ??
    undefined;
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText, 420);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "createdAt", sort: "desc" },
  ]);
  const [data, setData] = useState<Destination[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const gridColumns = useMemo<GridColDef<Destination>[]>(
    () => [
      { field: "name", headerName: "Destinazione", flex: 1, minWidth: 220 },
      {
        field: "city",
        headerName: "Citta",
        flex: 0.8,
        minWidth: 140,
        valueGetter: (_, row) => row.city || "-",
      },
      {
        field: "description",
        headerName: "Descrizione",
        flex: 1,
        minWidth: 220,
        valueGetter: (_, row) => row.description || "-",
      },
      {
        field: "address",
        headerName: "Indirizzo",
        flex: 1,
        minWidth: 220,
        valueGetter: (_, row) => row.address || "-",
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
        flex: 1,
        minWidth: 220,
        valueGetter: (_, row) => row.notes || "-",
      },
    ],
    [],
  );

  const selectedRow = useMemo(
    () => data.find((item) => item.id === selectedDestinationId) ?? null,
    [data, selectedDestinationId],
  );

  const selectedFormValues = useMemo<DestinationFormData | undefined>(
    () =>
      selectedRow
        ? {
            organizationId: selectedRow.organizationId,
            name: selectedRow.name,
            description: selectedRow.description ?? "",
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
    const loadDestinations = async () => {
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
        const response = await searchDestinations({
          pageIndex: paginationModel.page,
          pageSize: paginationModel.pageSize,
          searchText: debouncedSearchText || undefined,
          sortBy: toDestinationSortField(sort?.field),
          sortDescending: sort?.sort === "desc",
          organizationId: scopedOrganizationId,
        });

        if (!isDisposed) {
          setData(response.items);
          setTotalCount(response.totalCount);
          if (
            selectedDestinationId &&
            !response.items.some((item) => item.id === selectedDestinationId)
          ) {
            setSelectedDestinationId(null);
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

    void loadDestinations();

    return () => {
      isDisposed = true;
    };
  }, [
    debouncedSearchText,
    paginationModel.page,
    paginationModel.pageSize,
    reloadKey,
    scopedOrganizationId,
    selectedDestinationId,
    session,
    sortModel,
  ]);

  if (!session) {
    return (
      <LoadingState message="Inizializzazione workspace Destinations..." />
    );
  }

  const canEditOrDelete = Boolean(selectedDestinationId && selectedRow);

  const handleCreate = async (values: DestinationFormData) => {
    if (!scopedOrganizationId) {
      return;
    }

    const created = await createDestination({
      ...values,
      organizationId: scopedOrganizationId,
    });
    setReloadKey((current) => current + 1);
    setSelectedDestinationId(created.id);
  };

  const handleEdit = async (values: DestinationFormData) => {
    if (!selectedDestinationId || !scopedOrganizationId) {
      return;
    }

    await updateDestination(selectedDestinationId, {
      ...values,
      organizationId: scopedOrganizationId,
    });
    setReloadKey((current) => current + 1);
  };

  const handleDelete = async () => {
    if (!selectedDestinationId) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteDestination(selectedDestinationId);
      setSelectedDestinationId(null);
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
    <Stack spacing={4}>
      <ContentCard className="overflow-hidden p-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Box sx={workspaceHeaderIconSx}>
              <Place sx={{ fontSize: 24 }} />
            </Box>
            <Typography variant="sectionEyebrow" sx={{ fontSize: 16 }}>
              Destinazioni
            </Typography>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={workspacePrimaryActionButtonSx}
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Nuova
            </Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              disabled={!canEditOrDelete}
              sx={workspacePrimaryActionButtonSx}
              onClick={() => setIsEditDialogOpen(true)}
            >
              Modifica
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteOutline />}
              disabled={!canEditOrDelete}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Elimina
            </Button>
          </div>
        </div>
      </ContentCard>

      <ContentCard>
        <Stack spacing={3}>
          <SearchToolbar
            searchText={searchText}
            searchPlaceholder="Cerca destinazione per nome, citta, provincia o descrizione"
            onSearchTextChange={(value) => {
              setSearchText(value);
              setPaginationModel((current) => ({ ...current, page: 0 }));
            }}
          />

          {listError ? (
            <ErrorState
              title="Ricerca destinazioni non riuscita."
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
                  return params.row.id === selectedDestinationId
                    ? `${rowClassName} workspace-row-selected`
                    : rowClassName;
                }}
                paginationMode="server"
                sortingMode="server"
                rowCount={totalCount}
                pageSizeOptions={[10, 20, 50]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                sortModel={sortModel}
                onSortModelChange={setSortModel}
                loading={isLoading}
                disableRowSelectionOnClick
                onRowClick={(params: GridRowParams<Destination>) =>
                  setSelectedDestinationId((current) =>
                    current === params.row.id ? null : params.row.id,
                  )
                }
                sx={organizationsEnterpriseDataGridSx}
              />
            </div>
          )}
        </Stack>
      </ContentCard>

      <DestinationFormDialog
        open={isCreateDialogOpen}
        mode="create"
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreate}
      />

      <DestinationFormDialog
        open={isEditDialogOpen}
        mode="edit"
        initialValues={selectedFormValues}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEdit}
      />

      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        title="Eliminare destinazione"
        description={`La destinazione ${selectedRow?.name ?? "selezionata"} verra rimossa definitivamente.`}
        confirmLabel="Elimina destinazione"
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
