"use client";

import { Search } from "@mui/icons-material";
import { InputAdornment, MenuItem, Stack, TextField } from "@mui/material";

export type SelectOption = {
  value: string;
  label: string;
};

export type ToolbarFilter = {
  key: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  minWidth?: number;
};

type SearchToolbarProps = Readonly<{
  searchText: string;
  onSearchTextChange: (value: string) => void;
  filterValue?: string;
  filterOptions?: SelectOption[];
  filterLabel?: string;
  onFilterChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
}>;

export function SearchToolbar({
  searchText,
  onSearchTextChange,
  filterValue,
  filterOptions,
  filterLabel,
  onFilterChange,
  searchPlaceholder,
  filters,
}: SearchToolbarProps) {
  const resolvedFilters =
    filters && filters.length > 0
      ? filters
      : filterOptions && onFilterChange
        ? [
            {
              key: "legacy-filter",
              label: filterLabel ?? "Filtro",
              value: filterValue ?? "",
              options: filterOptions,
              onChange: onFilterChange,
              minWidth: 200,
            },
          ]
        : [];

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      <TextField
        fullWidth
        label="Cerca"
        placeholder={
          searchPlaceholder ?? "Cerca per nome, codice o descrizione"
        }
        value={searchText}
        onChange={(event) => onSearchTextChange(event.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      {resolvedFilters.map((filter) => (
        <TextField
          key={filter.key}
          select
          label={filter.label}
          value={filter.value}
          onChange={(event) => filter.onChange(event.target.value)}
          sx={{ minWidth: { md: filter.minWidth ?? 200 } }}
        >
          {filter.options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      ))}
    </Stack>
  );
}
