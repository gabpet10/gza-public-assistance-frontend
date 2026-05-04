"use client";

import { Search } from "@mui/icons-material";
import { InputAdornment, MenuItem, Stack, TextField } from "@mui/material";
import type { ReactNode } from "react";

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
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  rightActions?: ReactNode;
}>;

export function SearchToolbar({
  searchText,
  onSearchTextChange,
  searchPlaceholder,
  filters,
  rightActions,
}: SearchToolbarProps) {
  const resolvedFilters = filters ?? [];

  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={1}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ flex: 1 }}
      >
        <TextField
          fullWidth
          size="small"
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
            size="small"
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
      {rightActions ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {rightActions}
        </Stack>
      ) : null}
    </Stack>
  );
}
