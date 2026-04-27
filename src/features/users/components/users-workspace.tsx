"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Add,
  DeleteOutline,
  Edit,
  Group,
  ToggleOff,
  ToggleOn,
  VisibilityOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRowParams,
  type GridSortModel,
} from "@mui/x-data-grid";
import { toApiUiError } from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import {
  createUserForOrganization,
  deleteUserFromOrganization,
  getUserById,
  searchUsers,
  toUserActiveFilter,
  updateUser,
} from "@/features/users/api/users-api";
import type {
  User,
  UserFormData,
  UserStatusFilter,
} from "@/features/users/api/types";
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
import { ConfirmActionDialog } from "@/shared/ui/confirm-action-dialog";
import { ContentCard } from "@/shared/ui/content-card";
import {
  getWorkspaceGridRowClassName,
  organizationsEnterpriseDataGridSx,
  workspaceDetailActionButtonSx,
  workspaceDetailActionIconSx,
} from "@/shared/ui/data-grid/workspace-data-grid-styles";
import { ErrorState, LoadingState } from "@/shared/ui/feedback-states";
import { SearchToolbar } from "@/shared/ui/search-toolbar";
import {
  workspaceDetailCloseButtonSx,
  workspaceHeaderIconSx,
  workspacePrimaryActionButtonSx,
} from "@/shared/ui/workspace-styles";

const statusOptions = [
  { value: "all", label: "Tutti" },
  { value: "active", label: "Attivi" },
  { value: "inactive", label: "Non attivi" },
] as const;

export function UsersWorkspace() {
  const { session } = useAuth();
  const scopedOrganizationId =
    session?.activeOrganizationId ??
    session?.memberships?.[0]?.organizationId ??
    undefined;
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText, 420);
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "createdAt", sort: "desc" },
  ]);
  const [data, setData] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [openedUserId, setOpenedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusActionError, setStatusActionError] = useState<string | null>(
    null,
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const openUserDetail = (userId: string) => {
    setSelectedUserId(userId);
    setOpenedUserId(userId);
  };

  const handleRowClick = (params: GridRowParams<User>) => {
    setSelectedUserId((current) =>
      current === params.row.id ? null : params.row.id,
    );
  };

  const gridColumns = useMemo<GridColDef<User>[]>(
    () => [
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
                openUserDetail(params.row.id);
              }}
            >
              <VisibilityOutlined sx={workspaceDetailActionIconSx} />
            </IconButton>
          </Tooltip>
        ),
      },
      { field: "email", headerName: "Email", flex: 1.2, minWidth: 220 },
      {
        field: "firstName",
        headerName: "Nome",
        flex: 0.7,
        minWidth: 130,
        valueGetter: (_, row) => row.firstName || "-",
      },
      {
        field: "lastName",
        headerName: "Cognome",
        flex: 0.7,
        minWidth: 130,
        valueGetter: (_, row) => row.lastName || "-",
      },
      {
        field: "phone",
        headerName: "Telefono",
        flex: 0.8,
        minWidth: 150,
        sortable: false,
        valueGetter: (_, row) => row.phone || "-",
      },
      {
        field: "isActive",
        headerName: "Stato",
        flex: 0.6,
        minWidth: 130,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value ? "Attivo" : "Non attivo"}
            color={params.value ? "success" : "default"}
            variant={params.value ? "filled" : "outlined"}
          />
        ),
      },
    ],
    [],
  );

  const selectedRow = useMemo(
    () => data.find((item) => item.id === selectedUserId) ?? null,
    [data, selectedUserId],
  );

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    if (!data.some((item) => item.id === selectedUserId)) {
      setSelectedUserId(null);
    }
  }, [data, selectedUserId]);

  const selectedUserFormValues = useMemo<UserFormData | undefined>(() => {
    const source =
      selectedRow ??
      (selectedUser?.id && selectedUser.id === selectedUserId
        ? selectedUser
        : null);
    if (!source) {
      return undefined;
    }

    return {
      email: source.email,
      password: "",
      firstName: source.firstName ?? "",
      lastName: source.lastName ?? "",
      phone: source.phone ?? "",
      isActive: source.isActive,
    };
  }, [selectedRow, selectedUser, selectedUserId]);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isDisposed = false;
    const loadUsers = async () => {
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
        const response = await searchUsers({
          pageIndex: paginationModel.page,
          pageSize: paginationModel.pageSize,
          searchText: debouncedSearchText || undefined,
          sortBy: sort?.field,
          sortDescending: sort?.sort === "desc",
          isActive: toUserActiveFilter(statusFilter),
          organizationId: scopedOrganizationId,
        });

        if (!isDisposed) {
          setData(response.items);
          setTotalCount(response.totalCount);
        }
      } catch (error) {
        if (!isDisposed) {
          const message = toApiUiError(
            error,
            "Caricamento non riuscito.",
          ).userMessage;
          setListError(message);
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      isDisposed = true;
    };
  }, [
    debouncedSearchText,
    paginationModel.page,
    paginationModel.pageSize,
    reloadKey,
    scopedOrganizationId,
    session,
    sortModel,
    statusFilter,
  ]);

  useEffect(() => {
    if (!session || !openedUserId) {
      return;
    }

    let isDisposed = false;
    const loadDetail = async () => {
      setIsDetailLoading(true);
      setDetailError(null);

      try {
        const response = await getUserById(openedUserId, scopedOrganizationId);
        if (!isDisposed) {
          setSelectedUser(response);
        }
      } catch (error) {
        if (!isDisposed) {
          const message = toApiUiError(
            error,
            "Dettaglio non disponibile.",
          ).userMessage;
          setDetailError(message);
        }
      } finally {
        if (!isDisposed) {
          setIsDetailLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      isDisposed = true;
    };
  }, [openedUserId, scopedOrganizationId, session]);

  const selectedUserName =
    selectedUser?.email ?? selectedRow?.email ?? "utente selezionato";
  const isSelectedUserActive =
    selectedUser?.isActive ?? selectedRow?.isActive ?? false;
  const canEditOrDelete = Boolean(
    selectedUserId &&
    ((selectedRow && selectedRow.id === selectedUserId) ||
      (selectedUser && selectedUser.id === selectedUserId)),
  );

  if (!session) {
    return <LoadingState message="Inizializzazione workspace Users..." />;
  }

  const handleCreateUser = async (values: UserFormData) => {
    if (!session) {
      return;
    }

    if (!scopedOrganizationId) {
      setListError(
        "Seleziona una organizzazione prima di creare un nuovo utente.",
      );
      return;
    }

    const created = await createUserForOrganization({
      organizationId: scopedOrganizationId,
      email: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      isActive: values.isActive,
    });
    setReloadKey((current) => current + 1);
    setSelectedUserId(created.id);
    setOpenedUserId(created.id);
  };

  const handleEditUser = async (values: UserFormData) => {
    if (!session || !selectedUserId) {
      return;
    }

    const updated = await updateUser(selectedUserId, values);
    setSelectedUser(updated);
    setReloadKey((current) => current + 1);
  };

  const handleDeleteUser = async () => {
    if (!session || !selectedUserId) {
      return;
    }

    if (!scopedOrganizationId) {
      setDeleteError(
        "Seleziona una organizzazione prima di eliminare un utente.",
      );
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteUserFromOrganization(scopedOrganizationId, selectedUserId);
      setIsDeleteDialogOpen(false);
      setSelectedUserId(null);
      if (openedUserId === selectedUserId) {
        setOpenedUserId(null);
      }
      setSelectedUser(null);
      setReloadKey((current) => current + 1);
    } catch (error) {
      const message = toApiUiError(
        error,
        "Eliminazione non riuscita.",
      ).userMessage;
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleUserStatus = async () => {
    if (!session || !selectedUserId || !selectedUserFormValues) {
      return;
    }

    setStatusActionError(null);
    setIsUpdatingStatus(true);

    try {
      const updated = await updateUser(selectedUserId, {
        ...selectedUserFormValues,
        isActive: !selectedUserFormValues.isActive,
      });

      setSelectedUser(updated);
      setReloadKey((current) => current + 1);
      setIsDeactivateDialogOpen(false);
    } catch (error) {
      const message = toApiUiError(
        error,
        "Aggiornamento stato non riuscito.",
      ).userMessage;
      setStatusActionError(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Stack spacing={4}>
      <ContentCard className="overflow-hidden p-0">
        <div className="flex flex-col  md:flex-row md:items-center md:justify-between ">
          <div className="flex min-w-0 items-center gap-3">
            <Box sx={workspaceHeaderIconSx}>
              <Group sx={{ fontSize: 24 }} />
            </Box>
            <div className="flex min-w-0 flex-col ">
              <Typography
                variant="sectionEyebrow"
                sx={{
                  fontSize: 16,
                }}
              >
                Utenti
              </Typography>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={workspacePrimaryActionButtonSx}
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Nuovo
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
              variant="outlined"
              color={isSelectedUserActive ? "warning" : "success"}
              startIcon={isSelectedUserActive ? <ToggleOff /> : <ToggleOn />}
              disabled={!canEditOrDelete}
              onClick={() => {
                if (isSelectedUserActive) {
                  setStatusActionError(null);
                  setIsDeactivateDialogOpen(true);
                  return;
                }

                void handleToggleUserStatus();
              }}
            >
              {isSelectedUserActive ? "Disattiva" : "Riattiva"}
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
            searchPlaceholder="Cerca utente per email, nome o telefono"
            onSearchTextChange={(value) => {
              setSearchText(value);
              setPaginationModel((current) => ({ ...current, page: 0 }));
            }}
            filterLabel="Stato"
            filterValue={statusFilter}
            filterOptions={[...statusOptions]}
            onFilterChange={(value) => {
              setStatusFilter(value as UserStatusFilter);
              setPaginationModel((current) => ({ ...current, page: 0 }));
            }}
          />

          {listError ? (
            <ErrorState
              title="Ricerca users non riuscita."
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
                  return params.row.id === selectedUserId
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
                onRowClick={handleRowClick}
                sx={organizationsEnterpriseDataGridSx}
              />
            </div>
          )}
        </Stack>
      </ContentCard>

      <Drawer
        anchor="right"
        open={Boolean(openedUserId)}
        onClose={() => setOpenedUserId(null)}
      >
        <div className="h-full w-[min(100vw,680px)] bg-[#fffdfa] p-6">
          <Stack spacing={2.5}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Typography variant="sectionEyebrow">Dettaglio</Typography>
                <Typography variant="sectionTitle">
                  {selectedUser?.email ??
                    data.find((item) => item.id === openedUserId)?.email ??
                    "Utente"}
                </Typography>
              </div>
              <Tooltip title="Chiudi">
                <IconButton
                  onClick={() => setOpenedUserId(null)}
                  sx={workspaceDetailCloseButtonSx}
                >
                  <VisibilityOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
            {isDetailLoading ? (
              <LoadingState message="Caricamento dettaglio utente..." />
            ) : null}
            {detailError ? <Alert severity="error">{detailError}</Alert> : null}
            {statusActionError ? (
              <Alert severity="warning">{statusActionError}</Alert>
            ) : null}
            {selectedUser ? (
              <ContentCard className="bg-white p-5">
                <Stack spacing={2}>
                  <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[#f2f4f7] p-4">
                    <Stack spacing={1.5}>
                      <div className="flex flex-wrap gap-2">
                        <Chip
                          icon={<Group />}
                          label={
                            selectedUser.isActive ? "Attivo" : "Non attivo"
                          }
                          color={selectedUser.isActive ? "success" : "default"}
                        />
                      </div>
                      <Typography variant="bodyMedium">
                        Nome: {selectedUser.firstName || "-"}
                      </Typography>
                      <Typography variant="bodyMedium">
                        Cognome: {selectedUser.lastName || "-"}
                      </Typography>
                      <Typography variant="bodyMedium">
                        Telefono: {selectedUser.phone || "-"}
                      </Typography>
                      <Typography variant="bodyMedium">
                        Ultimo accesso:{" "}
                        {selectedUser.lastLoginAt
                          ? new Intl.DateTimeFormat("it-IT", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(selectedUser.lastLoginAt))
                          : "-"}
                      </Typography>
                    </Stack>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                      variant="outlined"
                      color={selectedUser.isActive ? "warning" : "success"}
                      startIcon={
                        selectedUser.isActive ? <ToggleOff /> : <ToggleOn />
                      }
                      disabled={!canEditOrDelete}
                      onClick={() => {
                        if (selectedUser.isActive) {
                          setStatusActionError(null);
                          setIsDeactivateDialogOpen(true);
                          return;
                        }

                        void handleToggleUserStatus();
                      }}
                    >
                      {selectedUser.isActive
                        ? "Disattiva utente"
                        : "Riattiva utente"}
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
                </Stack>
              </ContentCard>
            ) : null}
          </Stack>
        </div>
      </Drawer>

      <UserFormDialog
        open={isCreateDialogOpen}
        mode="create"
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateUser}
      />

      <UserFormDialog
        open={isEditDialogOpen}
        mode="edit"
        initialValues={selectedUserFormValues}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEditUser}
      />

      <ConfirmActionDialog
        open={isDeactivateDialogOpen}
        title="Disattivare utente"
        description={`L'utente ${selectedUserName} verra marcato come non attivo.`}
        confirmLabel="Disattiva utente"
        onClose={() => {
          setIsDeactivateDialogOpen(false);
          setStatusActionError(null);
        }}
        onConfirm={handleToggleUserStatus}
        isConfirming={isUpdatingStatus}
        errorMessage={statusActionError}
      />

      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        title="Eliminare utente"
        description={`L'utente ${selectedUserName} verra rimosso definitivamente.`}
        confirmLabel="Elimina utente"
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteUser}
        isConfirming={isDeleting}
        errorMessage={deleteError}
      />
    </Stack>
  );
}
