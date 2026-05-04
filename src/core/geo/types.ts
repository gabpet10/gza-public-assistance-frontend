export type ItalianMunicipalityOption = {
  city: string;
  province: string;
  region: string;
  postalCodes: string[];
};

export type ItalianMunicipalityRaw = {
  nome?: string;
  sigla?: string;
  cap?: string[];
  regione?: {
    nome?: string;
  };
};

export type ItalianProvinceOption = {
  sigla: string;
  name: string;
  region: string;
};

export type ItalianProvinceRaw = {
  sigla?: string;
  nome?: string;
  regione?: string;
};

export type ItalianRegionOption = {
  name: string;
  code: string;
};

export type ItalianRegionRaw = {
  nome?: string;
  codice?: string;
};
