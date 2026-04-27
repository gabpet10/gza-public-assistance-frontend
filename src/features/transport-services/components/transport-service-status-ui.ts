import type { SxProps, Theme } from "@mui/material/styles";
import type {
  TransportPriority,
  TransportServiceStatus,
} from "@/features/transport-services/api/types";

type TransportStatusUi = {
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
};

type TransportPriorityUi = {
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
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

const transportPriorityUiByPriority: Record<
  TransportPriority,
  TransportPriorityUi
> = {
  routine: {
    label: "Ordinaria",
    bgColor: "#F5F5F5",
    borderColor: "#D1D1D1",
    textColor: "#2F2F2F",
  },
  urgent: {
    label: "Urgente",
    bgColor: "#FFF0F0",
    borderColor: "#F2A3A3",
    textColor: "#8F1111",
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

export function getTransportPriorityUi(
  priority: TransportPriority,
): TransportPriorityUi {
  return transportPriorityUiByPriority[priority];
}

export function getTransportPriorityLabel(priority: TransportPriority): string {
  return getTransportPriorityUi(priority).label;
}

export function getTransportPriorityChipSx(
  priority: TransportPriority,
): SxProps<Theme> {
  const ui = getTransportPriorityUi(priority);
  return {
    borderColor: ui.borderColor,
    backgroundColor: ui.bgColor,
    color: ui.textColor,
    fontWeight: 600,
  };
}
