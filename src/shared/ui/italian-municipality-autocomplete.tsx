"use client";

import { useMemo } from "react";
import { Autocomplete, TextField, type TextFieldProps } from "@mui/material";
import {
  normalizeSearchText,
  useItalianMunicipalities,
} from "@/core/geo/italian-address-data";
import type { ItalianMunicipalityOption } from "@/core/geo/types";

type ItalianMunicipalityAutocompleteProps = Readonly<{
  label?: string;
  value: string;
  onCityChange: (value: string) => void;
  onMunicipalitySelected?: (option: ItalianMunicipalityOption | null) => void;
  disabled?: boolean;
  required?: boolean;
  textFieldProps?: Omit<TextFieldProps, "label" | "value" | "onChange">;
}>;

export function ItalianMunicipalityAutocomplete({
  label = "Comune",
  value,
  onCityChange,
  onMunicipalitySelected,
  disabled,
  required,
  textFieldProps,
}: ItalianMunicipalityAutocompleteProps) {
  const { options, isLoading } = useItalianMunicipalities();
  const normalizedValue = normalizeSearchText(value);

  const selectedOption = useMemo(
    () =>
      options.find(
        (option) => normalizeSearchText(option.city) === normalizedValue,
      ) ?? null,
    [normalizedValue, options],
  );

  return (
    <Autocomplete<ItalianMunicipalityOption, false, false, true>
      freeSolo
      options={options}
      loading={isLoading}
      disabled={disabled}
      value={selectedOption ?? value}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.city
      }
      filterOptions={(list, state) => {
        const query = normalizeSearchText(state.inputValue);
        if (!query) {
          return list.slice(0, 80);
        }

        return list
          .filter((option) =>
            normalizeSearchText(
              `${option.city} ${option.province} ${option.region} ${option.postalCodes.join(" ")}`,
            ).includes(query),
          )
          .slice(0, 80);
      }}
      onInputChange={(_, nextInputValue, reason) => {
        if (reason === "input") {
          onCityChange(nextInputValue);
        }

        if (reason === "clear") {
          onCityChange("");
          onMunicipalitySelected?.(null);
        }
      }}
      onChange={(_, option) => {
        if (!option) {
          onCityChange("");
          onMunicipalitySelected?.(null);
          return;
        }

        if (typeof option === "string") {
          onCityChange(option);
          const matched = options.find(
            (candidate) =>
              normalizeSearchText(candidate.city) ===
              normalizeSearchText(option),
          );
          onMunicipalitySelected?.(matched ?? null);
          return;
        }

        onCityChange(option.city);
        onMunicipalitySelected?.(option);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          {...textFieldProps}
        />
      )}
      noOptionsText="Nessun comune trovato"
      loadingText="Caricamento comuni..."
    />
  );
}
