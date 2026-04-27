"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Radio,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Clear, Search } from "@mui/icons-material";
import { toApiUiError } from "@/core/api/errors";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import {
  FeatureDialogTitle,
  formDialogActionsEndSx,
  formDialogContentSx,
  formDialogPrimaryActionSx,
} from "./form-dialog-frame";

export type LookupOption = {
  id: string;
  label: string;
  description?: string | null;
  data?: Record<string, string | null | undefined>;
};

export type LookupSearchInput = {
  query: string;
  pageIndex: number;
  pageSize: number;
};

export type LookupSearchResult = {
  items: LookupOption[];
  hasNextPage: boolean;
};

type EntityLookupDialogFieldProps = {
  label: string;
  dialogTitle: string;
  value: string[];
  selectedOptions?: LookupOption[];
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  searchLabel?: string;
  triggerAriaLabel?: string;
  pageSize?: number;
  onChange: (ids: string[], options: LookupOption[]) => void;
  onSearch: (input: LookupSearchInput) => Promise<LookupSearchResult>;
};

export function EntityLookupDialogField({
  label,
  dialogTitle,
  value,
  selectedOptions,
  multiple = false,
  required = false,
  disabled = false,
  placeholder,
  helperText,
  searchLabel,
  triggerAriaLabel,
  pageSize = 20,
  onChange,
  onSearch,
}: EntityLookupDialogFieldProps) {
  const lookupActionSx = {
    width: 32,
    height: 32,
    border: "1px solid",
    borderColor: "divider",
    borderRadius: "999px",
  };

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const [results, setResults] = useState<LookupOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftIds, setDraftIds] = useState<string[]>(value);
  const [knownOptionsById, setKnownOptionsById] = useState<
    Record<string, LookupOption>
  >({});
  const requestIdRef = useRef(0);

  useEffect(() => {
    setDraftIds(value);
  }, [value]);

  useEffect(() => {
    if (!selectedOptions || selectedOptions.length === 0) {
      return;
    }

    setKnownOptionsById((current) => {
      const next = { ...current };
      for (const option of selectedOptions) {
        next[option.id] = option;
      }
      return next;
    });
  }, [selectedOptions]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let disposed = false;
    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    const loadFirstPage = async () => {
      setIsLoading(true);
      setError(null);
      setPageIndex(0);
      setHasNextPage(false);

      try {
        const response = await onSearch({
          query: debouncedQuery.trim(),
          pageIndex: 0,
          pageSize,
        });

        if (disposed || requestIdRef.current !== nextRequestId) {
          return;
        }

        setResults(response.items);
        setHasNextPage(response.hasNextPage);
        setKnownOptionsById((current) => {
          const next = { ...current };
          for (const option of response.items) {
            next[option.id] = option;
          }
          return next;
        });
      } catch (error) {
        if (!disposed) {
          setError(toApiUiError(error, "Ricerca non riuscita.").userMessage);
          setResults([]);
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    void loadFirstPage();

    return () => {
      disposed = true;
    };
  }, [debouncedQuery, onSearch, open, pageSize]);

  const loadMore = async () => {
    if (!open || isLoading || isLoadingMore || !hasNextPage) {
      return;
    }

    const nextPageIndex = pageIndex + 1;
    setIsLoadingMore(true);
    setError(null);

    try {
      const response = await onSearch({
        query: debouncedQuery.trim(),
        pageIndex: nextPageIndex,
        pageSize,
      });

      setPageIndex(nextPageIndex);
      setHasNextPage(response.hasNextPage);
      setResults((current) => {
        const existing = new Set(current.map((item) => item.id));
        const appended = response.items.filter(
          (item) => !existing.has(item.id),
        );
        return [...current, ...appended];
      });
      setKnownOptionsById((current) => {
        const next = { ...current };
        for (const option of response.items) {
          next[option.id] = option;
        }
        return next;
      });
    } catch (error) {
      setError(
        toApiUiError(error, "Caricamento risultati aggiuntivi non riuscito.")
          .userMessage,
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleResultsScroll = (event: React.UIEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const remaining =
      target.scrollHeight - target.scrollTop - target.clientHeight;
    if (remaining < 24) {
      void loadMore();
    }
  };

  const selectedLookupOptions = useMemo(() => {
    return value
      .map((id) => knownOptionsById[id])
      .filter((option): option is LookupOption => Boolean(option));
  }, [knownOptionsById, value]);

  const selectedDisplay =
    selectedLookupOptions.length > 0
      ? selectedLookupOptions.map((option) => option.label).join(", ")
      : "";
  const selectedSecondaryDisplay =
    !multiple && selectedLookupOptions.length === 1
      ? (selectedLookupOptions[0].description ?? "")
      : "";

  const handleToggle = (id: string) => {
    setDraftIds((current) => {
      if (multiple) {
        return current.includes(id)
          ? current.filter((existingId) => existingId !== id)
          : [...current, id];
      }

      return current[0] === id ? [] : [id];
    });
  };

  const handleConfirm = () => {
    const selected = draftIds
      .map((id) => knownOptionsById[id])
      .filter((option): option is LookupOption => Boolean(option));

    onChange(draftIds, selected);
    setOpen(false);
  };

  return (
    <Stack spacing={1.25}>
      <TextField
        label={label}
        value={selectedDisplay}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <Stack direction="row" spacing={0.75}>
                <IconButton
                  aria-label={
                    triggerAriaLabel ?? `Cerca ${label.toLowerCase()}`
                  }
                  onClick={() => setOpen(true)}
                  disabled={disabled}
                  size="small"
                  sx={lookupActionSx}
                >
                  <Search fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label={`Pulisci ${label.toLowerCase()}`}
                  onClick={() => {
                    setDraftIds([]);
                    onChange([], []);
                  }}
                  disabled={disabled || value.length === 0}
                  size="small"
                  sx={lookupActionSx}
                >
                  <Clear fontSize="small" />
                </IconButton>
              </Stack>
            </InputAdornment>
          ),
        }}
      />
      {selectedSecondaryDisplay ? (
        <Typography variant="caption" color="text.secondary">
          {selectedSecondaryDisplay}
        </Typography>
      ) : null}
      {helperText ? (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      ) : null}

      <Dialog
        open={open}
        onClose={isLoading ? undefined : () => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            minHeight: { xs: "78vh", sm: "72vh" },
            maxHeight: "90vh",
            display: "flex",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1.25 }}>
          <FeatureDialogTitle
            icon={<Search sx={{ fontSize: 20 }} />}
            eyebrow={dialogTitle}
          />
        </DialogTitle>
        <DialogContent
          sx={{
            ...formDialogContentSx,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack spacing={1.5} sx={{ pt: 1, flex: 1, minHeight: 0 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField
              label={searchLabel ?? "Ricerca"}
              placeholder="Digita per cercare"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            {isLoading ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.default",
                  minHeight: 320,
                  flex: 1,
                  minWidth: 0,
                  overflow: "auto",
                  px: 0.5,
                }}
                onScroll={handleResultsScroll}
              >
                <List dense>
                  {results.length === 0 ? (
                    <Typography
                      variant="bodySmall"
                      color="text.secondary"
                      sx={{ px: 1.5, py: 1.25 }}
                    >
                      Nessun risultato.
                    </Typography>
                  ) : (
                    results.map((option) => {
                      const selected = draftIds.includes(option.id);
                      return (
                        <ListItemButton
                          key={option.id}
                          onClick={() => handleToggle(option.id)}
                          selected={selected}
                          sx={{
                            borderRadius: 1.5,
                            mb: 0.5,
                            mx: 0.5,
                            border: "1px solid",
                            borderColor: selected ? "primary.main" : "divider",
                            bgcolor: selected
                              ? "action.selected"
                              : "background.paper",
                            "&:hover": {
                              bgcolor: selected
                                ? "action.selected"
                                : "action.hover",
                            },
                          }}
                        >
                          {multiple ? (
                            <Checkbox edge="start" checked={selected} />
                          ) : (
                            <Radio edge="start" checked={selected} />
                          )}
                          <ListItemText
                            primary={option.label}
                            secondary={option.description ?? undefined}
                          />
                        </ListItemButton>
                      );
                    })
                  )}
                </List>

                {isLoadingMore ? (
                  <Box sx={{ display: "grid", placeItems: "center", py: 1.25 }}>
                    <CircularProgress size={18} />
                  </Box>
                ) : null}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={formDialogActionsEndSx}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setDraftIds(value);
              setOpen(false);
            }}
            disabled={isLoading}
          >
            Annulla
          </Button>
          <Button
            variant="contained"
            sx={formDialogPrimaryActionSx}
            onClick={handleConfirm}
          >
            Conferma selezione
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
