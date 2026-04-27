"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Add,
  DeleteOutline,
  Edit,
  Handyman,
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
import { getProblemMessage } from "@/core/api/errors";
import { useAuth } from "@/core/auth/auth-context";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import {
  createSkill,
  deleteSkill,
  getSkillById,
  searchSkills,
  toBackendSkillType,
  toSkillActiveFilter,
  updateSkill,
} from "@/features/skills/api/skills-api";
import type {
  Skill,
  SkillFormData,
  SkillStatusFilter,
  SkillTypeFilter,
} from "@/features/skills/api/types";
import { skillTypeOptions } from "@/features/skills/api/types";
import { SkillFormDialog } from "@/features/skills/components/skill-form-dialog";
import { ConfirmActionDialog } from "@/shared/ui/confirm-action-dialog";
import { ContentCard } from "@/shared/ui/content-card";
import {
  getWorkspaceGridRowClassName,
  organizationsEnterpriseDataGridSx,
  workspaceDetailActionButtonSx,
  workspaceDetailActionIconSx,
} from "@/shared/ui/data-grid/workspace-data-grid-styles";
import { ErrorState, LoadingState } from "@/shared/ui/feedback-states";
import { SearchToolbar, type ToolbarFilter } from "@/shared/ui/search-toolbar";
import {
  workspaceDetailCloseButtonSx,
  workspaceHeaderIconSx,
  workspacePrimaryActionButtonSx,
} from "@/shared/ui/workspace-styles";

const statusOptions = [
  { value: "all", label: "Tutte" },
  { value: "active", label: "Attive" },
  { value: "inactive", label: "Non attive" },
] as const;

export function SkillsWorkspace() {
  const { session } = useAuth();
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText, 420);
  const [typeFilter, setTypeFilter] = useState<SkillTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<SkillStatusFilter>("all");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "createdAt", sort: "desc" },
  ]);
  const [data, setData] = useState<Skill[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [openedSkillId, setOpenedSkillId] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openSkillDetail = (skillId: string) => {
    setSelectedSkillId(skillId);
    setOpenedSkillId(skillId);
  };

  const handleRowClick = (params: GridRowParams<Skill>) => {
    setSelectedSkillId((current) =>
      current === params.row.id ? null : params.row.id,
    );
  };

  const gridColumns = useMemo<GridColDef<Skill>[]>(
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
                openSkillDetail(params.row.id);
              }}
            >
              <VisibilityOutlined sx={workspaceDetailActionIconSx} />
            </IconButton>
          </Tooltip>
        ),
      },
      { field: "name", headerName: "Skill", flex: 1.1, minWidth: 220 },
      { field: "type", headerName: "Tipo", flex: 0.8, minWidth: 160 },
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

  const toolbarFilters = useMemo<ToolbarFilter[]>(
    () => [
      {
        key: "type",
        label: "Tipo",
        value: typeFilter,
        options: [...skillTypeOptions],
        onChange: (value) => {
          setTypeFilter(value as SkillTypeFilter);
          setPaginationModel((current) => ({ ...current, page: 0 }));
        },
      },
      {
        key: "status",
        label: "Stato",
        value: statusFilter,
        options: [...statusOptions],
        onChange: (value) => {
          setStatusFilter(value as SkillStatusFilter);
          setPaginationModel((current) => ({ ...current, page: 0 }));
        },
      },
    ],
    [statusFilter, typeFilter],
  );

  const selectedRow = useMemo(
    () => data.find((item) => item.id === selectedSkillId) ?? null,
    [data, selectedSkillId],
  );

  useEffect(() => {
    if (!selectedSkillId) {
      return;
    }

    if (!data.some((item) => item.id === selectedSkillId)) {
      setSelectedSkillId(null);
    }
  }, [data, selectedSkillId]);

  const selectedSkillFormValues = useMemo<SkillFormData | undefined>(() => {
    const source = selectedSkill ?? selectedRow;
    if (!source) {
      return undefined;
    }

    return {
      name: source.name,
      type: source.type as SkillFormData["type"],
      isActive: source.isActive,
    };
  }, [selectedRow, selectedSkill]);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isDisposed = false;
    const loadSkills = async () => {
      setIsLoading(true);
      setListError(null);

      try {
        const sort = sortModel[0];
        const response = await searchSkills({
          pageIndex: paginationModel.page,
          pageSize: paginationModel.pageSize,
          searchText: debouncedSearchText || undefined,
          sortBy: sort?.field,
          sortDescending: sort?.sort === "desc",
          type: toBackendSkillType(typeFilter),
          isActive: toSkillActiveFilter(statusFilter),
        });

        if (!isDisposed) {
          setData(response.items);
          setTotalCount(response.totalCount);
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

    void loadSkills();

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
    typeFilter,
  ]);

  useEffect(() => {
    if (!session || !openedSkillId) {
      return;
    }

    let isDisposed = false;
    const loadDetail = async () => {
      setIsDetailLoading(true);
      setDetailError(null);

      try {
        const response = await getSkillById(openedSkillId);
        if (!isDisposed) {
          setSelectedSkill(response);
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
  }, [openedSkillId, session]);

  const selectedSkillName =
    selectedSkill?.name ?? selectedRow?.name ?? "skill selezionata";
  const canEditOrDelete = Boolean(
    selectedSkillId &&
    ((selectedRow && selectedRow.id === selectedSkillId) ||
      (selectedSkill && selectedSkill.id === selectedSkillId)),
  );

  if (!session) {
    return <LoadingState message="Inizializzazione workspace Skills..." />;
  }

  const handleCreateSkill = async (values: SkillFormData) => {
    if (!session) {
      return;
    }

    const created = await createSkill(values);
    setReloadKey((current) => current + 1);
    setSelectedSkillId(created.id);
    setOpenedSkillId(created.id);
  };

  const handleEditSkill = async (values: SkillFormData) => {
    if (!session || !selectedSkillId) {
      return;
    }

    const updated = await updateSkill(selectedSkillId, values);
    setSelectedSkill(updated);
    setReloadKey((current) => current + 1);
  };

  const handleDeleteSkill = async () => {
    if (!session || !selectedSkillId) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteSkill(selectedSkillId);
      setIsDeleteDialogOpen(false);
      setSelectedSkillId(null);
      if (openedSkillId === selectedSkillId) {
        setOpenedSkillId(null);
      }
      setSelectedSkill(null);
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
        <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between md:gap-4 md:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Box sx={workspaceHeaderIconSx}>
              <Handyman sx={{ fontSize: 24 }} />
            </Box>
            <div className="flex min-w-0 flex-col">
              <Typography variant="sectionEyebrow">Skills</Typography>
              <Typography
                variant="sectionTitle"
                className="break-words leading-tight"
              >
                Gestione Catalogo Competenze
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
            searchPlaceholder="Cerca skill per nome o tipologia"
            onSearchTextChange={(value) => {
              setSearchText(value);
              setPaginationModel((current) => ({ ...current, page: 0 }));
            }}
            filters={toolbarFilters}
          />
          {listError ? (
            <ErrorState
              title="Ricerca skills non riuscita."
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
                  return params.row.id === selectedSkillId
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
        open={Boolean(openedSkillId)}
        onClose={() => setOpenedSkillId(null)}
      >
        <div className="h-full w-[min(100vw,680px)] bg-[#fffdfa] p-6">
          <Stack spacing={2.5}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Typography variant="sectionEyebrow">Dettaglio</Typography>
                <Typography variant="sectionTitle">
                  {selectedSkill?.name ??
                    data.find((item) => item.id === openedSkillId)?.name ??
                    "Skill"}
                </Typography>
              </div>
              <Tooltip title="Chiudi">
                <IconButton
                  onClick={() => setOpenedSkillId(null)}
                  sx={workspaceDetailCloseButtonSx}
                >
                  <VisibilityOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
            {isDetailLoading ? (
              <LoadingState message="Caricamento dettaglio skill..." />
            ) : null}
            {detailError ? <Alert severity="error">{detailError}</Alert> : null}
            {selectedSkill ? (
              <ContentCard className="bg-white p-5">
                <Stack spacing={2}>
                  <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[#f2f4f7] p-4">
                    <Stack spacing={1.5}>
                      <div className="flex flex-wrap gap-2">
                        <Chip
                          icon={<Handyman />}
                          label={selectedSkill.type}
                          color="secondary"
                        />
                        <Chip
                          label={
                            selectedSkill.isActive ? "Attiva" : "Non attiva"
                          }
                          color={selectedSkill.isActive ? "success" : "default"}
                          variant={
                            selectedSkill.isActive ? "filled" : "outlined"
                          }
                        />
                      </div>
                      <Typography variant="bodyMedium">
                        Identificativo: {selectedSkill.id}
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

      <SkillFormDialog
        open={isCreateDialogOpen}
        mode="create"
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateSkill}
      />

      <SkillFormDialog
        open={isEditDialogOpen}
        mode="edit"
        initialValues={selectedSkillFormValues}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEditSkill}
      />

      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        title="Eliminare skill"
        description={`La skill ${selectedSkillName} verra rimossa definitivamente.`}
        confirmLabel="Elimina skill"
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteSkill}
        isConfirming={isDeleting}
        errorMessage={deleteError}
      />
    </Stack>
  );
}
