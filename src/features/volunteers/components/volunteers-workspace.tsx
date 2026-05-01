"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Add,
  CheckCircleOutline,
  DeleteOutline,
  Edit,
  Link,
  PlaylistAdd,
  RadioButtonUnchecked,
  VisibilityOutlined,
  VolunteerActivism,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRowParams } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import {
  ApiError,
  getErrorMessage,
  getProblemMessage,
} from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import { useServerGridState } from "@/shared/hooks/use-server-grid-state";
import { ErrorState, LoadingState } from "@/shared/ui/feedback-states";
import { SearchToolbar } from "@/shared/ui/search-toolbar";
import { ContentCard } from "@/shared/ui/content-card";
import { ConfirmActionDialog } from "@/shared/ui/confirm-action-dialog";
import {
  EntityLookupDialogField,
  type LookupOption,
  type LookupSearchInput,
  type LookupSearchResult,
} from "@/shared/ui/entity-lookup-dialog-field";
import {
  getWorkspaceGridRowClassName,
  organizationsEnterpriseDataGridSx,
  workspaceDetailActionButtonSx,
  workspaceDetailActionIconSx,
} from "@/shared/ui/data-grid/workspace-data-grid-styles";
import {
  workspaceDetailCloseButtonSx,
  workspaceHeaderIconSx,
  workspacePrimaryActionButtonSx,
} from "@/shared/ui/workspace-styles";
import {
  addVolunteerSkill,
  createVolunteer,
  deleteVolunteer,
  deleteVolunteerSkill,
  getVolunteerById,
  linkVolunteerUser,
  searchVolunteers,
  toBackendActiveFilter,
  updateVolunteer,
  updateVolunteerSkill,
} from "@/features/volunteers/api/volunteers-api";
import { searchUsers } from "@/features/users/api/users-api";
import {
  normalizeSkillType,
  toSkillTypeLabel,
} from "@/features/skills/api/types";
import type {
  Volunteer,
  VolunteerFormData,
  VolunteerListItem,
  VolunteerSkill,
  VolunteerSkillFormData,
  VolunteerStatusFilter,
} from "@/features/volunteers/api/types";
import {
  normalizeSkillLevel,
  toSkillLevelLabel,
} from "@/features/volunteers/api/types";
import { VolunteerFormDialog } from "@/features/volunteers/components/volunteer-form-dialog";
import { VolunteerSkillFormDialog } from "@/features/volunteers/components/volunteer-skill-form-dialog";

const statusOptions = [
  { value: "all", label: "Tutti" },
  { value: "active", label: "Attivi" },
  { value: "inactive", label: "Non attivi" },
] as const;

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("it-IT").format(new Date(value));
}

function getLinkedUserLabel(volunteer: VolunteerListItem | Volunteer) {
  const fullName = [volunteer.userFirstName, volunteer.userLastName]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  return volunteer.userEmail || "-";
}

function getLinkedUserEmail(volunteer: VolunteerListItem | Volunteer) {
  const normalizedEmail = volunteer.userEmail?.trim();
  return normalizedEmail || "-";
}

const baseGridColumns: GridColDef<VolunteerListItem>[] = [
  {
    field: "fullName",
    headerName: "Volontario",
    flex: 1.4,
    minWidth: 240,
  },
  {
    field: "phone",
    headerName: "Telefono",
    flex: 1,
    minWidth: 160,
    sortable: false,
  },
  {
    field: "fiscalCode",
    headerName: "Codice fiscale",
    flex: 1,
    minWidth: 180,
  },
  {
    field: "userId",
    headerName: "Utente collegato",
    flex: 1,
    minWidth: 260,
    sortable: false,
    renderCell: (params) => {
      const row = params.row;
      const linkedUserEmail = getLinkedUserEmail(row);

      return (
        <Typography variant="bodySmall" color="text.secondary" noWrap>
          {linkedUserEmail}
        </Typography>
      );
    },
  },
  {
    field: "createdAt",
    headerName: "Creato il",
    minWidth: 140,
    flex: 0.8,
    valueFormatter: (value?: string) =>
      value ? new Intl.DateTimeFormat("it-IT").format(new Date(value)) : "-",
  },
  {
    field: "isActive",
    headerName: "Stato",
    minWidth: 140,
    flex: 0.7,
    renderCell: (params) => (
      <Chip
        size="small"
        label={params.value ? "Attivo" : "Non attivo"}
        color={params.value ? "success" : "default"}
        variant={params.value ? "filled" : "outlined"}
      />
    ),
  },
];

export function VolunteersWorkspace() {
  const { session } = useAuth();
  const scopedOrganizationId =
    session?.activeOrganizationId ?? session?.memberships?.[0]?.organizationId;
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
    useState<VolunteerStatusFilter>("all");
  const [data, setData] = useState<VolunteerListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(
    null,
  );
  const [openedVolunteerId, setOpenedVolunteerId] = useState<string | null>(
    null,
  );
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(
    null,
  );
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [detailReloadKey, setDetailReloadKey] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSkillCreateDialogOpen, setIsSkillCreateDialogOpen] = useState(false);
  const [isSkillEditDialogOpen, setIsSkillEditDialogOpen] = useState(false);
  const [selectedVolunteerSkill, setSelectedVolunteerSkill] =
    useState<VolunteerSkill | null>(null);
  const [skillActionError, setSkillActionError] = useState<string | null>(null);
  const [isDeleteVolunteerDialogOpen, setIsDeleteVolunteerDialogOpen] =
    useState(false);
  const [isDeleteSkillDialogOpen, setIsDeleteSkillDialogOpen] = useState(false);
  const [pendingDeleteSkill, setPendingDeleteSkill] =
    useState<VolunteerSkill | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  const [isLinkUserDialogOpen, setIsLinkUserDialogOpen] = useState(false);
  const [linkUserId, setLinkUserId] = useState("");
  const [linkUserLabel, setLinkUserLabel] = useState("");
  const [linkUserDescription, setLinkUserDescription] = useState("");
  const [linkUserError, setLinkUserError] = useState<string | null>(null);
  const [isLinkingUser, setIsLinkingUser] = useState(false);

  const openVolunteerDetail = (volunteerId: string) => {
    setSelectedVolunteerId(volunteerId);
    setOpenedVolunteerId(volunteerId);
  };

  const handleRowClick = (params: GridRowParams<VolunteerListItem>) => {
    setSelectedVolunteerId((current) =>
      current === params.row.id ? null : params.row.id,
    );
  };

  const gridColumns = useMemo<GridColDef<VolunteerListItem>[]>(
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
                openVolunteerDetail(params.row.id);
              }}
            >
              <VisibilityOutlined sx={workspaceDetailActionIconSx} />
            </IconButton>
          </Tooltip>
        ),
      },
      ...baseGridColumns,
    ],
    [],
  );

  const skillGridColumns = useMemo<GridColDef<VolunteerSkill>[]>(
    () => [
      {
        field: "skillType",
        headerName: "Tipo",
        flex: 1,
        minWidth: 180,
        valueGetter: (_value, row) => toSkillTypeLabel(row.skillType),
      },
      {
        field: "level",
        headerName: "Livello",
        flex: 0.8,
        minWidth: 130,
        valueGetter: (_value, row) => toSkillLevelLabel(row.level),
      },
      {
        field: "verified",
        headerName: "Verificata",
        flex: 1,
        minWidth: 160,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value ? "Verificata" : "Da verificare"}
            color={params.value ? "success" : "default"}
            icon={
              params.value ? <CheckCircleOutline /> : <RadioButtonUnchecked />
            }
          />
        ),
      },
      {
        field: "actions",
        headerName: "Operazioni",
        width: 120,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "center",
        renderCell: (params) => (
          <div className="volunteer-skill-actions flex items-center gap-1">
            <Tooltip title="Modifica skill">
              <IconButton
                size="small"
                sx={workspaceDetailActionButtonSx}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedVolunteerSkill(params.row);
                  setIsSkillEditDialogOpen(true);
                }}
              >
                <Edit sx={workspaceDetailActionIconSx} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rimuovi skill">
              <IconButton
                size="small"
                sx={{
                  backgroundColor: "error.main",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  "&:hover": {
                    backgroundColor: "error.dark",
                  },
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  setConfirmError(null);
                  setPendingDeleteSkill(params.row);
                  setIsDeleteSkillDialogOpen(true);
                }}
              >
                <DeleteOutline sx={workspaceDetailActionIconSx} />
              </IconButton>
            </Tooltip>
          </div>
        ),
      },
    ],
    [],
  );

  const selectedRow = useMemo(
    () => data.find((item) => item.id === selectedVolunteerId) ?? null,
    [data, selectedVolunteerId],
  );

  const selectedVolunteerFormValues = useMemo<
    VolunteerFormData | undefined
  >(() => {
    const source = selectedVolunteer ?? selectedRow;
    if (!source) {
      return undefined;
    }

    return {
      organizationId: source.organizationId,
      firstName: source.firstName,
      lastName: source.lastName,
      phone: source.phone,
      fiscalCode: source.fiscalCode,
      isActive: source.isActive,
    };
  }, [selectedRow, selectedVolunteer]);

  const selectedVolunteerSkillFormValues = useMemo<
    VolunteerSkillFormData | undefined
  >(
    () =>
      selectedVolunteerSkill
        ? {
            skillType:
              normalizeSkillType(selectedVolunteerSkill.skillType) ?? "medico",
            level:
              normalizeSkillLevel(selectedVolunteerSkill.level) ?? "nessuno",
            verified: selectedVolunteerSkill.verified,
          }
        : undefined,
    [selectedVolunteerSkill],
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    let isDisposed = false;

    const loadVolunteers = async () => {
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
        const response = await searchVolunteers({
          pageIndex: paginationModel.page,
          pageSize: paginationModel.pageSize,
          searchText: debouncedSearchText || undefined,
          sortBy: sort?.field,
          sortDescending: sort?.sort === "desc",
          isActive: toBackendActiveFilter(statusFilter),
          organizationId: scopedOrganizationId,
        });

        if (!isDisposed) {
          setData(response.items);
          setTotalCount(response.totalCount);
          if (
            selectedVolunteerId &&
            !response.items.some((item) => item.id === selectedVolunteerId)
          ) {
            setSelectedVolunteerId(null);
            setOpenedVolunteerId(null);
            setSelectedVolunteer(null);
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

    void loadVolunteers();

    return () => {
      isDisposed = true;
    };
  }, [
    debouncedSearchText,
    paginationModel.page,
    paginationModel.pageSize,
    reloadKey,
    scopedOrganizationId,
    selectedVolunteerId,
    session,
    sortModel,
    statusFilter,
  ]);

  useEffect(() => {
    if (!session || !openedVolunteerId) {
      return;
    }

    let isDisposed = false;

    const loadDetail = async () => {
      setIsDetailLoading(true);
      setDetailError(null);

      try {
        const response = await getVolunteerById(
          openedVolunteerId,
          scopedOrganizationId,
        );
        if (!isDisposed) {
          setSelectedVolunteer(response);
        }
      } catch (error) {
        if (!isDisposed) {
          const message =
            error instanceof Error
              ? getProblemMessage((error as { problem?: never }).problem)
              : "Dettaglio non disponibile.";
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
  }, [detailReloadKey, openedVolunteerId, scopedOrganizationId, session]);

  if (!session) {
    return <LoadingState message="Inizializzazione workspace Volunteers..." />;
  }

  const selectedVolunteerName =
    selectedVolunteer?.fullName ??
    selectedRow?.fullName ??
    "volontario selezionato";
  const detailLinkedUserSource = selectedVolunteer?.userEmail?.trim().length
    ? selectedVolunteer
    : (selectedRow ?? selectedVolunteer);
  const detailLinkedUserEmail = detailLinkedUserSource
    ? getLinkedUserEmail(detailLinkedUserSource)
    : "-";
  const canEditOrDelete = Boolean(
    selectedVolunteerId &&
    ((selectedRow && selectedRow.id === selectedVolunteerId) ||
      (selectedVolunteer && selectedVolunteer.id === selectedVolunteerId)),
  );

  const handleCreateVolunteer = async (values: VolunteerFormData) => {
    if (!session || !scopedOrganizationId) {
      setListError(
        "Seleziona una organizzazione prima di creare un volontario.",
      );
      return;
    }

    const created = await createVolunteer({
      ...values,
      organizationId: scopedOrganizationId,
    });
    setReloadKey((current) => current + 1);
    setSelectedVolunteerId(created.id);
    setOpenedVolunteerId(created.id);
  };

  const handleEditVolunteer = async (values: VolunteerFormData) => {
    if (!session || !selectedVolunteerId || !scopedOrganizationId) {
      return;
    }

    const updated = await updateVolunteer(selectedVolunteerId, {
      ...values,
      organizationId: scopedOrganizationId,
    });
    setSelectedVolunteer(updated);
    setReloadKey((current) => current + 1);
    setDetailReloadKey((current) => current + 1);
  };

  const handleCreateVolunteerSkill = async (values: VolunteerSkillFormData) => {
    if (!session || !selectedVolunteerId) {
      return;
    }

    setSkillActionError(null);
    await addVolunteerSkill(selectedVolunteerId, values);
    setReloadKey((current) => current + 1);
    setDetailReloadKey((current) => current + 1);
  };

  const handleEditVolunteerSkill = async (values: VolunteerSkillFormData) => {
    if (!session || !selectedVolunteerId || !selectedVolunteerSkill) {
      return;
    }

    setSkillActionError(null);
    await updateVolunteerSkill(selectedVolunteerId, selectedVolunteerSkill.id, {
      level: values.level,
      verified: values.verified,
    });
    setReloadKey((current) => current + 1);
    setDetailReloadKey((current) => current + 1);
  };

  const handleDeleteVolunteerSkill = async (volunteerSkillId: string) => {
    if (!session || !selectedVolunteerId) {
      return;
    }

    try {
      setSkillActionError(null);
      setConfirmError(null);
      setIsConfirmingAction(true);
      await deleteVolunteerSkill(selectedVolunteerId, volunteerSkillId);
      setReloadKey((current) => current + 1);
      setDetailReloadKey((current) => current + 1);
      if (selectedVolunteerSkill?.id === volunteerSkillId) {
        setSelectedVolunteerSkill(null);
      }
      setPendingDeleteSkill(null);
      setIsDeleteSkillDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? getProblemMessage((error as { problem?: never }).problem)
          : "Rimozione skill non riuscita.";
      setSkillActionError(message);
      setConfirmError(message);
    } finally {
      setIsConfirmingAction(false);
    }
  };

  const handleDeleteVolunteer = async () => {
    if (!session || !selectedVolunteerId) {
      return;
    }

    setConfirmError(null);
    setIsConfirmingAction(true);

    try {
      await deleteVolunteer(selectedVolunteerId);
      setIsDeleteVolunteerDialogOpen(false);
      setSelectedVolunteerId(null);
      if (openedVolunteerId === selectedVolunteerId) {
        setOpenedVolunteerId(null);
      }
      setSelectedVolunteer(null);
      setSelectedVolunteerSkill(null);
      setPendingDeleteSkill(null);
      setReloadKey((current) => current + 1);
      setDetailReloadKey((current) => current + 1);
    } catch (error) {
      const message =
        error instanceof Error
          ? getProblemMessage((error as { problem?: never }).problem)
          : "Eliminazione volunteer non riuscita.";
      setConfirmError(message);
    } finally {
      setIsConfirmingAction(false);
    }
  };

  const searchUserLookup = async (
    input: LookupSearchInput,
    organizationId: string,
  ): Promise<LookupSearchResult> => {
    const response = await searchUsers({
      pageIndex: input.pageIndex,
      pageSize: input.pageSize,
      searchText: input.query || undefined,
      organizationId,
      isActive: true,
    });

    return {
      items: response.items.map(
        (item): LookupOption => ({
          id: item.id,
          label:
            [item.firstName, item.lastName]
              .map((value) => value?.trim() ?? "")
              .filter(Boolean)
              .join(" ") ||
            item.email ||
            item.id,
          description: item.email || undefined,
        }),
      ),
      hasNextPage: response.hasNextPage,
    };
  };

  const handleOpenLinkUserDialog = () => {
    if (!selectedVolunteer) {
      return;
    }

    setLinkUserId(selectedVolunteer.userId ?? "");
    setLinkUserLabel(
      selectedVolunteer.userId ? getLinkedUserLabel(selectedVolunteer) : "",
    );
    setLinkUserDescription(selectedVolunteer.userEmail ?? "");
    setLinkUserError(null);
    setIsLinkUserDialogOpen(true);
  };

  const handleLinkUser = async () => {
    if (!selectedVolunteerId) {
      return;
    }

    if (!linkUserId.trim()) {
      setLinkUserError("Seleziona un utente da collegare.");
      return;
    }

    setLinkUserError(null);
    setIsLinkingUser(true);

    try {
      await linkVolunteerUser(selectedVolunteerId, { userId: linkUserId });

      if (openedVolunteerId) {
        const refreshedVolunteer = await getVolunteerById(
          openedVolunteerId,
          scopedOrganizationId,
        );
        setSelectedVolunteer(refreshedVolunteer);
      }

      setIsLinkUserDialogOpen(false);
      setReloadKey((current) => current + 1);
      setDetailReloadKey((current) => current + 1);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setLinkUserError(
          "Utente o volontario non trovato. Verifica che l'utente esista nell'organizzazione.",
        );
      } else if (error instanceof ApiError && error.status === 409) {
        setLinkUserError(
          "Impossibile collegare l'utente: esiste gia un collegamento incompatibile.",
        );
      } else {
        setLinkUserError(
          getErrorMessage(error, "Collegamento utente non riuscito."),
        );
      }
    } finally {
      setIsLinkingUser(false);
    }
  };

  return (
    <Stack spacing={4}>
      <ContentCard className="overflow-hidden p-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between ">
          <div className="flex min-w-0 items-center gap-3">
            <Box sx={workspaceHeaderIconSx}>
              <VolunteerActivism sx={{ fontSize: 24 }} />
            </Box>
            <div className="flex min-w-0 flex-col">
              <Typography variant="sectionEyebrow" sx={{ fontSize: 16 }}>
                Volontari
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
              variant="contained"
              color="error"
              startIcon={<DeleteOutline />}
              disabled={!canEditOrDelete}
              onClick={() => {
                setConfirmError(null);
                setIsDeleteVolunteerDialogOpen(true);
              }}
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
            searchPlaceholder="Cerca volontario per nome, codice fiscale o telefono"
            onSearchTextChange={setSearchText}
            filters={[
              {
                key: "status",
                label: "Stato",
                value: statusFilter,
                options: [...statusOptions],
                onChange: (value) => {
                  setStatusFilter(value as VolunteerStatusFilter);
                  setPaginationModel((current) => ({ ...current, page: 0 }));
                },
              },
            ]}
          />

          {listError ? (
            <ErrorState
              title="Ricerca volunteers non riuscita."
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
                  return params.row.id === selectedVolunteerId
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

      <Drawer
        anchor="right"
        open={Boolean(openedVolunteerId)}
        onClose={() => setOpenedVolunteerId(null)}
      >
        <div className="h-full w-[min(100vw,680px)] bg-[#fffdfa] p-6">
          <Stack spacing={2.5}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Typography variant="sectionEyebrow">Dettaglio</Typography>
                <Typography variant="sectionTitle">
                  {selectedVolunteer?.fullName ??
                    data.find((item) => item.id === openedVolunteerId)
                      ?.fullName ??
                    "Volontario"}
                </Typography>
              </div>
              <Tooltip title="Chiudi">
                <IconButton
                  onClick={() => setOpenedVolunteerId(null)}
                  sx={workspaceDetailCloseButtonSx}
                >
                  <VisibilityOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>

            {isDetailLoading ? (
              <LoadingState message="Caricamento dettaglio volontario..." />
            ) : null}
            {detailError || skillActionError ? (
              <Alert severity={detailError ? "error" : "warning"}>
                {detailError ?? skillActionError}
              </Alert>
            ) : null}

            {selectedVolunteer ? (
              <Stack spacing={2.5}>
                <div className="grid gap-3">
                  <ContentCard className="bg-white p-5">
                    <Stack spacing={1.5}>
                      <Typography variant="sectionEyebrow">Azioni</Typography>
                      <div className="flex flex-wrap items-center gap-2">
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
                          startIcon={<Link />}
                          sx={workspacePrimaryActionButtonSx}
                          onClick={handleOpenLinkUserDialog}
                        >
                          Collega utente
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<PlaylistAdd />}
                          sx={workspacePrimaryActionButtonSx}
                          onClick={() => setIsSkillCreateDialogOpen(true)}
                        >
                          Aggiungi skill
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<DeleteOutline />}
                          disabled={!canEditOrDelete}
                          onClick={() => {
                            setConfirmError(null);
                            setIsDeleteVolunteerDialogOpen(true);
                          }}
                        >
                          Elimina
                        </Button>
                      </div>
                    </Stack>
                  </ContentCard>

                  <ContentCard className="bg-white p-5">
                    <Stack spacing={1.5}>
                      <Typography variant="sectionEyebrow">
                        Anagrafica
                      </Typography>
                      <div className="flex flex-wrap gap-2">
                        <Chip
                          label={
                            selectedVolunteer.isActive ? "Attivo" : "Non attivo"
                          }
                          color={
                            selectedVolunteer.isActive ? "success" : "default"
                          }
                          variant={
                            selectedVolunteer.isActive ? "filled" : "outlined"
                          }
                        />
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[#f7f9fc]">
                        <div className="grid grid-cols-[140px,1fr] items-start gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                          <Typography
                            variant="bodySmall"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Volontario
                          </Typography>
                          <Typography
                            variant="bodyMedium"
                            sx={{ fontWeight: 500 }}
                          >
                            {selectedVolunteer.fullName || "-"}
                          </Typography>
                        </div>
                        <div className="grid grid-cols-[140px,1fr] items-start gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                          <Typography
                            variant="bodySmall"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Telefono
                          </Typography>
                          <Typography
                            variant="bodyMedium"
                            sx={{ fontWeight: 500 }}
                          >
                            {selectedVolunteer.phone || "-"}
                          </Typography>
                        </div>
                        <div className="grid grid-cols-[140px,1fr] items-start gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                          <Typography
                            variant="bodySmall"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Codice fiscale
                          </Typography>
                          <Typography
                            variant="bodyMedium"
                            sx={{ fontWeight: 500 }}
                          >
                            {selectedVolunteer.fiscalCode || "-"}
                          </Typography>
                        </div>
                        <div className="grid grid-cols-[140px,1fr] items-start gap-4 border-b border-[color:var(--border-soft)] px-4 py-3">
                          <Typography
                            variant="bodySmall"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Utente collegato
                          </Typography>
                          <Typography
                            variant="bodyMedium"
                            sx={{ fontWeight: 500 }}
                          >
                            {detailLinkedUserEmail}
                          </Typography>
                        </div>
                        <div className="grid grid-cols-[140px,1fr] items-start gap-4 px-4 py-3">
                          <Typography
                            variant="bodySmall"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Creato il
                          </Typography>
                          <Typography
                            variant="bodyMedium"
                            sx={{ fontWeight: 500 }}
                          >
                            {formatDate(selectedVolunteer.createdAt)}
                          </Typography>
                        </div>
                      </div>
                    </Stack>
                  </ContentCard>
                </div>

                <ContentCard className="bg-white p-5">
                  <Stack spacing={2}>
                    <Typography variant="sectionEyebrow">Skills</Typography>
                    {selectedVolunteer.skills.length ? (
                      <DataGrid
                        className="volunteer-skill-grid"
                        autoHeight
                        rows={selectedVolunteer.skills}
                        columns={skillGridColumns}
                        getRowId={(row) => row.id}
                        hideFooter
                        disableRowSelectionOnClick
                        getRowClassName={getWorkspaceGridRowClassName}
                        sx={organizationsEnterpriseDataGridSx}
                      />
                    ) : (
                      <Typography variant="bodyMedium" color="text.secondary">
                        Nessuna skill associata al volontario selezionato.
                      </Typography>
                    )}
                  </Stack>
                </ContentCard>
              </Stack>
            ) : !isDetailLoading && selectedVolunteerId ? (
              <Typography variant="bodyMedium" color="text.secondary">
                Seleziona una riga per visualizzare i dettagli completi del
                volontario.
              </Typography>
            ) : null}
          </Stack>
        </div>
      </Drawer>

      <VolunteerFormDialog
        open={isCreateDialogOpen}
        mode="create"
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateVolunteer}
      />

      <VolunteerFormDialog
        open={isEditDialogOpen}
        mode="edit"
        initialValues={selectedVolunteerFormValues}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEditVolunteer}
      />

      <VolunteerSkillFormDialog
        open={isSkillCreateDialogOpen}
        mode="create"
        onClose={() => setIsSkillCreateDialogOpen(false)}
        onSubmit={handleCreateVolunteerSkill}
      />

      <VolunteerSkillFormDialog
        open={isSkillEditDialogOpen}
        mode="edit"
        initialValues={selectedVolunteerSkillFormValues}
        onClose={() => {
          setIsSkillEditDialogOpen(false);
          setSelectedVolunteerSkill(null);
        }}
        onSubmit={handleEditVolunteerSkill}
      />

      <Dialog
        open={isLinkUserDialogOpen}
        onClose={
          isLinkingUser ? undefined : () => setIsLinkUserDialogOpen(false)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Collega utente</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1.5 }}>
            {linkUserError ? (
              <Alert severity="warning">{linkUserError}</Alert>
            ) : null}
            <EntityLookupDialogField
              label="Utente"
              dialogTitle="Seleziona utente"
              value={linkUserId ? [linkUserId] : []}
              selectedOptions={
                linkUserId
                  ? [
                      {
                        id: linkUserId,
                        label: linkUserLabel || linkUserId,
                        description: linkUserDescription || undefined,
                      },
                    ]
                  : []
              }
              required
              triggerAriaLabel="Apri ricerca utenti"
              disabled={isLinkingUser || !scopedOrganizationId}
              onSearch={(input) =>
                scopedOrganizationId
                  ? searchUserLookup(input, scopedOrganizationId)
                  : Promise.resolve({ items: [], hasNextPage: false })
              }
              onChange={(ids, options) => {
                setLinkUserId(ids[0] ?? "");
                setLinkUserLabel(options[0]?.label ?? "");
                setLinkUserDescription(options[0]?.description ?? "");
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setIsLinkUserDialogOpen(false)}
            disabled={isLinkingUser}
          >
            Annulla
          </Button>
          <Button
            variant="contained"
            startIcon={<Link />}
            onClick={handleLinkUser}
            disabled={isLinkingUser || !linkUserId.trim()}
          >
            Collega
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmActionDialog
        open={isDeleteVolunteerDialogOpen}
        title="Eliminare volontario"
        description={`Il volontario ${selectedVolunteerName} verra eliminato definitivamente.`}
        confirmLabel="Elimina volontario"
        onClose={() => {
          setIsDeleteVolunteerDialogOpen(false);
          setConfirmError(null);
        }}
        onConfirm={handleDeleteVolunteer}
        isConfirming={isConfirmingAction}
        errorMessage={confirmError}
      />

      <ConfirmActionDialog
        open={isDeleteSkillDialogOpen}
        title="Rimuovere skill"
        description={`La skill ${toSkillTypeLabel(pendingDeleteSkill?.skillType ?? "selezionata")} verra rimossa dal volunteer ${selectedVolunteer?.fullName ?? selectedRow?.fullName ?? "corrente"}.`}
        confirmLabel="Rimuovi skill"
        onClose={() => {
          setIsDeleteSkillDialogOpen(false);
          setPendingDeleteSkill(null);
          setConfirmError(null);
        }}
        onConfirm={() =>
          handleDeleteVolunteerSkill(pendingDeleteSkill?.id ?? "")
        }
        isConfirming={isConfirmingAction}
        errorMessage={confirmError}
      />
    </Stack>
  );
}
