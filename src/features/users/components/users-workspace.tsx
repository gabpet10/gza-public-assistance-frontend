"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminPanelSettings,
  Add,
  Badge,
  DeleteOutline,
  Edit,
  Group,
  ToggleOff,
  ToggleOn,
  VolunteerActivism,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  type SvgIconProps,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRowParams,
} from "@mui/x-data-grid";
import { toApiUiError } from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import { useServerGridState } from "@/shared/hooks/use-server-grid-state";
import {
  createUser,
  createUserForOrganization,
  deleteUserFromOrganization,
  searchUsers,
  toUserActiveFilter,
  updateUser,
} from "@/features/users/api/users-api";
import type {
  User,
  UserFormData,
  UserStatusFilter,
} from "@/features/users/api/types";
import { toUserTypeLabel, userTypeOptions } from "@/features/users/api/types";
import { getEffectiveRoleFromSession } from "@/core/auth/roles";
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
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

const statusOptions = [
  { value: "all", label: "Tutti" },
  { value: "active", label: "Attivi" },
  { value: "inactive", label: "Non attivi" },
] as const;

function getUserTypeIcon(type: string | null | undefined) {
  const iconProps: SvgIconProps = {
    fontSize: "small",
    sx: { color: "var(--accent-secondary)" },
  };

  if (type === "admin") {
    return <AdminPanelSettings {...iconProps} />;
  }

  if (type === "volunteer") {
    return <VolunteerActivism {...iconProps} />;
  }

  return <Badge {...iconProps} />;
}

export function UsersWorkspace() {
  const { session } = useAuth();
  const effectiveRole = getEffectiveRoleFromSession(session);
  const scopedOrganizationId =
    session?.activeOrganizationId ??
    session?.memberships?.[0]?.organizationId ??
    undefined;
  const isSuperUserGlobalMode = effectiveRole === "SUPER_USER";
  const organizationVisibleUserTypes = useMemo(
    () => userTypeOptions.filter((option) => option.value !== "admin"),
    [],
  );
  const allowedCreateUserTypeOptions = useMemo(() => {
    if (isSuperUserGlobalMode) {
      return userTypeOptions.filter((option) => option.value === "admin");
    }

    return organizationVisibleUserTypes;
  }, [isSuperUserGlobalMode, organizationVisibleUserTypes]);
  const allowedEditUserTypeOptions = useMemo(() => {
    if (isSuperUserGlobalMode) {
      return userTypeOptions.filter((option) => option.value === "admin");
    }

    return organizationVisibleUserTypes;
  }, [isSuperUserGlobalMode, organizationVisibleUserTypes]);
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
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [data, setData] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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

  const handleRowClick = (params: GridRowParams<User>) => {
    setSelectedUserId((current) =>
      current === params.row.id ? null : params.row.id,
    );
  };

  const gridColumns = useMemo<GridColDef<User>[]>(
    () => [
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
        field: "userType",
        headerName: "Tipo",
        flex: 0.8,
        minWidth: 140,
        renderCell: (params) => (
          <Stack direction="row" spacing={1} alignItems="center">
            {getUserTypeIcon(params.row.userType)}
            <span>{toUserTypeLabel(params.row.userType)}</span>
          </Stack>
        ),
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
    const source = selectedRow;
    if (!source) {
      return undefined;
    }

    return {
      email: source.email,
      password: "",
      firstName: source.firstName,
      lastName: source.lastName,
      phone: source.phone ?? "",
      isActive: source.isActive,
      userType: source.userType,
    };
  }, [selectedRow]);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isDisposed = false;
    const loadUsers = async () => {
      setIsLoading(true);
      setListError(null);

      try {
        const sort = sortModel[0];
        const response = await searchUsers({
          pageIndex: paginationModel.page,
          pageSize: paginationModel.pageSize,
          searchText: debouncedSearchText || undefined,
          sortBy: sort?.field,
          sortDescending: sort?.sort === "desc",
          isActive: toUserActiveFilter(statusFilter),
          organizationId: isSuperUserGlobalMode
            ? undefined
            : scopedOrganizationId,
          userTypes: isSuperUserGlobalMode
            ? ["admin"]
            : organizationVisibleUserTypes.map((option) => option.value),
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
    organizationVisibleUserTypes,
    isSuperUserGlobalMode,
    session,
    sortModel,
    statusFilter,
  ]);

  const selectedUserName = selectedRow?.email ?? "utente selezionato";
  const isSelectedUserActive = selectedRow?.isActive ?? false;
  const canEditOrDelete = Boolean(selectedUserId && selectedRow);
  const canDeleteUser = Boolean(canEditOrDelete && scopedOrganizationId);

  if (!session) {
    return <LoadingState message="Inizializzazione workspace Users..." />;
  }

  const handleCreateUser = async (values: UserFormData) => {
    if (!session) {
      return;
    }

    if (isSuperUserGlobalMode) {
      if (values.userType !== "admin") {
        throw new Error(
          "Fuori dal contesto organizzazione puoi creare solo utenti Admin.",
        );
      }

      const created = await createUser(values);
      setReloadKey((current) => current + 1);
      setSelectedUserId(created.id);
      return;
    }

    if (!scopedOrganizationId) {
      throw new Error(
        "Seleziona una organizzazione prima di creare un nuovo utente.",
      );
    }

    if (values.userType === "admin") {
      throw new Error(
        "Nel contesto organizzazione non puoi creare utenti Admin.",
      );
    }

    const created = await createUserForOrganization({
      organizationId: scopedOrganizationId,
      email: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      isActive: values.isActive,
      userType: values.userType,
    });
    setReloadKey((current) => current + 1);
    setSelectedUserId(created.id);
  };

  const handleEditUser = async (values: UserFormData) => {
    if (!session || !selectedUserId) {
      return;
    }

    if (isSuperUserGlobalMode && values.userType !== "admin") {
      throw new Error(
        "Fuori dal contesto organizzazione puoi assegnare solo il tipo Admin.",
      );
    }

    if (!isSuperUserGlobalMode && values.userType === "admin") {
      throw new Error(
        "Nel contesto organizzazione non puoi assegnare il tipo Admin.",
      );
    }

    await updateUser(selectedUserId, values);
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
      await updateUser(selectedUserId, {
        ...selectedUserFormValues,
        isActive: !selectedUserFormValues.isActive,
      });

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
              disabled={!canDeleteUser}
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
            onSearchTextChange={setSearchText}
            filters={[
              {
                key: "status",
                label: "Stato",
                value: statusFilter,
                options: [...statusOptions],
                onChange: (value) => {
                  setStatusFilter(value as UserStatusFilter);
                  setPaginationModel((current) => ({ ...current, page: 0 }));
                },
              },
            ]}
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

      <UserFormDialog
        open={isCreateDialogOpen}
        mode="create"
        allowedUserTypes={allowedCreateUserTypeOptions}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateUser}
      />

      <UserFormDialog
        open={isEditDialogOpen}
        mode="edit"
        initialValues={selectedUserFormValues}
        allowedUserTypes={allowedEditUserTypeOptions}
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
