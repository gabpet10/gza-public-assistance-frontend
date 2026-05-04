"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ItalianMunicipalityOption,
  ItalianMunicipalityRaw,
  ItalianProvinceOption,
  ItalianProvinceRaw,
  ItalianRegionOption,
  ItalianRegionRaw,
} from "@/core/geo/types";

const MUNICIPALITIES_DATA_URL = "/data/geo/comuni.json";
const PROVINCES_DATA_URL = "/data/geo/province.json";
const REGIONS_DATA_URL = "/data/geo/regioni.json";

let municipalitiesCache: ItalianMunicipalityOption[] | null = null;
let municipalitiesPromise: Promise<ItalianMunicipalityOption[]> | null = null;
let provincesCache: ItalianProvinceOption[] | null = null;
let provincesPromise: Promise<ItalianProvinceOption[]> | null = null;
let regionsCache: ItalianRegionOption[] | null = null;
let regionsPromise: Promise<ItalianRegionOption[]> | null = null;

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toMunicipalityOption(
  item: ItalianMunicipalityRaw,
): ItalianMunicipalityOption | null {
  const city = item.nome?.trim();
  if (!city) {
    return null;
  }

  return {
    city,
    province: item.sigla?.trim() ?? "",
    region: item.regione?.nome?.trim() ?? "",
    postalCodes: Array.isArray(item.cap) ? item.cap : [],
  };
}

async function loadItalianMunicipalities() {
  if (municipalitiesCache) {
    return municipalitiesCache;
  }

  if (!municipalitiesPromise) {
    municipalitiesPromise = fetch(MUNICIPALITIES_DATA_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Dataset comuni non disponibile.");
        }

        const payload = (await response.json()) as ItalianMunicipalityRaw[];
        const normalized = payload
          .map(toMunicipalityOption)
          .filter((item): item is ItalianMunicipalityOption => item !== null)
          .sort((left, right) => left.city.localeCompare(right.city, "it"));

        municipalitiesCache = normalized;
        return normalized;
      })
      .catch((error) => {
        municipalitiesPromise = null;
        throw error;
      });
  }

  return municipalitiesPromise;
}

function toProvinceOption(
  item: ItalianProvinceRaw,
): ItalianProvinceOption | null {
  const sigla = item.sigla?.trim().toUpperCase();
  const name = item.nome?.trim();
  if (!sigla || !name) {
    return null;
  }

  return {
    sigla,
    name,
    region: item.regione?.trim() ?? "",
  };
}

function toRegionOption(item: ItalianRegionRaw): ItalianRegionOption | null {
  const name = item.nome?.trim();
  if (!name) {
    return null;
  }

  return {
    name,
    code: item.codice?.trim() ?? "",
  };
}

async function loadItalianProvinces() {
  if (provincesCache) {
    return provincesCache;
  }

  if (!provincesPromise) {
    provincesPromise = fetch(PROVINCES_DATA_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Dataset province non disponibile.");
        }

        const payload = (await response.json()) as ItalianProvinceRaw[];
        const normalized = payload
          .map(toProvinceOption)
          .filter((item): item is ItalianProvinceOption => item !== null)
          .sort((left, right) => left.sigla.localeCompare(right.sigla, "it"));

        provincesCache = normalized;
        return normalized;
      })
      .catch((error) => {
        provincesPromise = null;
        throw error;
      });
  }

  return provincesPromise;
}

async function loadItalianRegions() {
  if (regionsCache) {
    return regionsCache;
  }

  if (!regionsPromise) {
    regionsPromise = fetch(REGIONS_DATA_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Dataset regioni non disponibile.");
        }

        const payload = (await response.json()) as ItalianRegionRaw[];
        const normalized = payload
          .map(toRegionOption)
          .filter((item): item is ItalianRegionOption => item !== null)
          .sort((left, right) => left.name.localeCompare(right.name, "it"));

        regionsCache = normalized;
        return normalized;
      })
      .catch((error) => {
        regionsPromise = null;
        throw error;
      });
  }

  return regionsPromise;
}

export function useItalianMunicipalities() {
  const [options, setOptions] = useState<ItalianMunicipalityOption[]>(
    municipalitiesCache ?? [],
  );
  const [isLoading, setIsLoading] = useState(!municipalitiesCache);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    if (municipalitiesCache) {
      setOptions(municipalitiesCache);
      setIsLoading(false);
      return () => {
        disposed = true;
      };
    }

    setIsLoading(true);
    setLoadError(null);

    void loadItalianMunicipalities()
      .then((items) => {
        if (!disposed) {
          setOptions(items);
        }
      })
      .catch((error) => {
        if (!disposed) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Dataset comuni non disponibile.",
          );
          setOptions([]);
        }
      })
      .finally(() => {
        if (!disposed) {
          setIsLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, []);

  const hasData = useMemo(() => options.length > 0, [options.length]);

  return {
    options,
    isLoading,
    loadError,
    hasData,
  };
}

export function useItalianProvinces() {
  const [options, setOptions] = useState<ItalianProvinceOption[]>(
    provincesCache ?? [],
  );
  const [isLoading, setIsLoading] = useState(!provincesCache);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    if (provincesCache) {
      setOptions(provincesCache);
      setIsLoading(false);
      return () => {
        disposed = true;
      };
    }

    setIsLoading(true);
    setLoadError(null);

    void loadItalianProvinces()
      .then((items) => {
        if (!disposed) {
          setOptions(items);
        }
      })
      .catch((error) => {
        if (!disposed) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Dataset province non disponibile.",
          );
          setOptions([]);
        }
      })
      .finally(() => {
        if (!disposed) {
          setIsLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, []);

  return {
    options,
    isLoading,
    loadError,
  };
}

export function useItalianRegions() {
  const [options, setOptions] = useState<ItalianRegionOption[]>(
    regionsCache ?? [],
  );
  const [isLoading, setIsLoading] = useState(!regionsCache);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    if (regionsCache) {
      setOptions(regionsCache);
      setIsLoading(false);
      return () => {
        disposed = true;
      };
    }

    setIsLoading(true);
    setLoadError(null);

    void loadItalianRegions()
      .then((items) => {
        if (!disposed) {
          setOptions(items);
        }
      })
      .catch((error) => {
        if (!disposed) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Dataset regioni non disponibile.",
          );
          setOptions([]);
        }
      })
      .finally(() => {
        if (!disposed) {
          setIsLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, []);

  return {
    options,
    isLoading,
    loadError,
  };
}
