"use client";

import { useState } from "react";
import { type GridPaginationModel, type GridSortModel } from "@mui/x-data-grid";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

type UseServerGridStateOptions = {
  initialPageSize?: number;
  debounceMs?: number;
  defaultSortModel?: GridSortModel;
};

const defaultSort: GridSortModel = [{ field: "createdAt", sort: "desc" }];

export function useServerGridState({
  initialPageSize = 10,
  debounceMs = 420,
  defaultSortModel = defaultSort,
}: UseServerGridStateOptions = {}) {
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText, debounceMs);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: initialPageSize,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>(defaultSortModel);

  const handleSearchTextChange = (value: string) => {
    setSearchText(value);
    setPaginationModel((current) => ({ ...current, page: 0 }));
  };

  const handlePaginationModelChange = (nextModel: GridPaginationModel) => {
    queueMicrotask(() => {
      setPaginationModel((current) => {
        if (
          current.page === nextModel.page &&
          current.pageSize === nextModel.pageSize
        ) {
          return current;
        }

        return nextModel;
      });
    });
  };

  const handleSortModelChange = (nextModel: GridSortModel) => {
    const normalizedModel = nextModel.length > 0 ? nextModel : defaultSortModel;

    queueMicrotask(() => {
      setSortModel((current) => {
        const currentSerialized = JSON.stringify(current);
        const nextSerialized = JSON.stringify(normalizedModel);

        if (currentSerialized === nextSerialized) {
          return current;
        }

        return normalizedModel;
      });
    });
  };

  return {
    searchText,
    debouncedSearchText,
    paginationModel,
    sortModel,
    setSearchText: handleSearchTextChange,
    setPaginationModel,
    setSortModel,
    handlePaginationModelChange,
    handleSortModelChange,
  };
}
