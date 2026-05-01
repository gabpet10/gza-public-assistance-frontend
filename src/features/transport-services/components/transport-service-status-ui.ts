import type { SxProps, Theme } from "@mui/material/styles";
import type {
  TransportServiceStatus,
  TransportType,
} from "@/features/transport-services/api/types";

type TransportStatusUi = {
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
};

const transportTypeLabels: Record<TransportType, string> = {
  sanitario: "Sanitario",
  sociale: "Sociale",
  dimissione_ospedaliera: "Dimissione ospedaliera",
  visita_programmata: "Visita programmata",
  dialisi: "Dialisi",
  riabilitazione: "Riabilitazione",
  trasferimento_struttura: "Trasferimento struttura",
  accompagnamento_amministrativo: "Accompagnamento amministrativo",
};

const transportStatusUiByStatus: Record<
  TransportServiceStatus,
  TransportStatusUi
> = {
  pending: {
    label: "In attesa",
    bgColor: "#FFF3E0",
    borderColor: "#FFCC80",
    textColor: "#A85A00",
  },
  accepted: {
    label: "Accettato",
    bgColor: "#E8F5E9",
    borderColor: "#A5D6A7",
    textColor: "#1B5E20",
  },
  assigned: {
    label: "Assegnato",
    bgColor: "#E3F2FD",
    borderColor: "#90CAF9",
    textColor: "#0D47A1",
  },
  in_progress: {
    label: "In corso",
    bgColor: "#E8EAF6",
    borderColor: "#9FA8DA",
    textColor: "#1A237E",
  },
  completed: {
    label: "Completato",
    bgColor: "#E0F2F1",
    borderColor: "#80CBC4",
    textColor: "#004D40",
  },
  cancelled: {
    label: "Annullato",
    bgColor: "#FDECEA",
    borderColor: "#EF9A9A",
    textColor: "#B71C1C",
  },
};

export function getTransportStatusUi(
  status: TransportServiceStatus,
): TransportStatusUi {
  return transportStatusUiByStatus[status];
}

export function getTransportStatusLabel(
  status: TransportServiceStatus,
): string {
  return getTransportStatusUi(status).label;
}

export function getTransportStatusChipSx(
  status: TransportServiceStatus,
): SxProps<Theme> {
  const ui = getTransportStatusUi(status);
  return {
    borderColor: ui.borderColor,
    backgroundColor: ui.bgColor,
    color: ui.textColor,
    fontWeight: 600,
  };
}

export function getTransportTypeLabel(transportType: TransportType): string {
  return transportTypeLabels[transportType];
}
