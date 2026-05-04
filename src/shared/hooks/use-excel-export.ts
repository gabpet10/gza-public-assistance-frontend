"use client";

import { useCallback } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import * as XLSX from "xlsx";

function normalizeCellValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
}

function toSafeFileName(fileName: string) {
  const normalized = fileName.trim() || "export";
  return normalized.toLowerCase().endsWith(".xlsx")
    ? normalized
    : `${normalized}.xlsx`;
}

export function useExcelExport() {
  const exportRowsToExcel = useCallback(
    <TRow extends Record<string, unknown>>(
      rows: TRow[],
      columns: GridColDef<TRow>[],
      fileName: string,
    ) => {
      const exportableColumns = columns.filter(
        (column) =>
          Boolean(column.field) &&
          column.field !== "actions" &&
          column.disableExport !== true,
      );

      const records = rows.map((row) => {
        const record: Record<string, unknown> = {};

        exportableColumns.forEach((column) => {
          const header =
            typeof column.headerName === "string" && column.headerName.trim()
              ? column.headerName
              : column.field;

          const rawValue = (() => {
            if (typeof column.valueGetter === "function") {
              return (
                column.valueGetter as (value: unknown, row: TRow) => unknown
              )(row[column.field], row);
            }

            return row[column.field];
          })();

          record[header] = normalizeCellValue(rawValue);
        });

        return record;
      });

      const worksheet = XLSX.utils.json_to_sheet(records);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Dati");
      XLSX.writeFile(workbook, toSafeFileName(fileName));
    },
    [],
  );

  return { exportRowsToExcel };
}
