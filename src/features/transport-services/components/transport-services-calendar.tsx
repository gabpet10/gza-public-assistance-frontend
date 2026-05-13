import { AccessTime } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { EventCalendar } from "@mui/x-scheduler";
import type { TransportCalendarEvent } from "@/features/transport-services/api/types";
import {
  getTransportStatusLabel,
  getTransportTypeLabel,
} from "@/features/transport-services/components/transport-service-status-ui";
import { ContentCard } from "@/shared/ui/content-card";

type TransportServicesCalendarProps = {
  events: TransportCalendarEvent[];
  errorMessage?: string | null;
  selectedEventId: string | null;
  view: "day" | "week" | "month" | "agenda";
  visibleDateIso: string;
  onViewChange: (view: "day" | "week" | "month" | "agenda") => void;
  onVisibleDateChange: (nextVisibleDateIso: string) => void;
  onSelectEvent: (eventId: string) => void;
  onOpenEventDetail: (eventId: string) => void;
  onCreateSlot: (seedDateIso: string) => void;
  onRescheduleEvent: (
    eventId: string,
    nextStartIso: string,
    nextEndIso: string,
  ) => Promise<boolean>;
};

type OptimisticSchedule = {
  start: string;
  end: string;
};

type SchedulerTransportEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  color: "amber" | "green" | "blue" | "indigo" | "teal" | "grey";
  draggable: boolean;
  resizable: boolean;
  readOnly: boolean;
  className?: string;
};

const EVENT_TOKEN_CLASS_PREFIX = "transport-scheduler-event-token-";

function toEventClassToken(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function toSchedulerColor(status: TransportCalendarEvent["status"]) {
  switch (status) {
    case "pending":
      return "amber" as const;
    case "accepted":
      return "green" as const;
    case "assigned":
      return "blue" as const;
    case "in_progress":
      return "indigo" as const;
    case "completed":
      return "teal" as const;
    case "cancelled":
      return "grey" as const;
    default:
      return "blue" as const;
  }
}

function toCleanLabel(label: string | null | undefined) {
  const trimmed = label?.trim();
  return trimmed ? trimmed : null;
}

function toClientLabel(event: TransportCalendarEvent) {
  return (
    toCleanLabel(event.clientDisplayName) ??
    toCleanLabel(event.clientFullName) ??
    toCleanLabel([event.clientFirstName, event.clientLastName].join(" "))
  );
}

function toDestinationLabel(event: TransportCalendarEvent) {
  return (
    toCleanLabel(event.pickupDestinationDisplayName) ??
    toCleanLabel(event.pickupDestinationName) ??
    toCleanLabel(
      [
        event.pickupDestinationAddress,
        event.pickupDestinationCity,
        event.pickupDestinationProvince,
      ]
        .filter((value) => value?.trim())
        .join(", "),
    ) ??
    toCleanLabel(
      [event.dropoffAddress, event.dropoffCity, event.dropoffProvince]
        .filter((value) => value?.trim())
        .join(", "),
    )
  );
}

function toVehicleLabel(event: TransportCalendarEvent) {
  return (
    toCleanLabel(event.vehicleDisplayName) ??
    toCleanLabel(
      [event.vehicleDescription, event.vehiclePlateNumber, event.vehicleType]
        .filter((value) => value?.trim())
        .join(" · "),
    )
  );
}

function buildCalendarEventTitle(event: TransportCalendarEvent) {
  const resolvedClientLabel = toClientLabel(event);
  const fallbackTitle = event.title?.trim() || "";
  const hasSafeFallbackTitle =
    fallbackTitle.length > 0 &&
    !fallbackTitle.toLowerCase().startsWith("trasport");

  const clientTitle = resolvedClientLabel
    ? resolvedClientLabel
    : hasSafeFallbackTitle
      ? fallbackTitle
      : "Servizio";
  const destinationLabel = toDestinationLabel(event);

  if (!destinationLabel) {
    return clientTitle;
  }

  return `${clientTitle} · ${destinationLabel}`;
}

function formatEventTimeRange(event: TransportCalendarEvent) {
  const start = dayjs(event.scheduledAt);
  const end = event.scheduledEnd ? dayjs(event.scheduledEnd) : null;

  if (!start.isValid()) {
    return "Orario non disponibile";
  }

  if (end && end.isValid()) {
    return `${start.format("DD/MM HH:mm")} - ${end.format("HH:mm")}`;
  }

  return start.format("DD/MM HH:mm");
}

function isDateOnlyValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTimeOnlyValue(value: string) {
  return /^\d{1,2}:\d{2}(:\d{2})?$/.test(value);
}

function toNormalizedTimeValue(value: string) {
  const [rawHours, rawMinutes = "00", rawSeconds = "00"] = value.split(":");
  const hours = rawHours.padStart(2, "0");
  const minutes = rawMinutes.padStart(2, "0");
  const seconds = rawSeconds.padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function startOfSchedulerWeek(base: dayjs.Dayjs) {
  return base.startOf("week").startOf("day");
}

function parseDayNumberFromText(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 31) {
    return null;
  }

  return parsed;
}

export function TransportServicesCalendar({
  events,
  errorMessage,
  selectedEventId,
  view,
  visibleDateIso,
  onViewChange,
  onVisibleDateChange,
  onSelectEvent,
  onOpenEventDetail,
  onCreateSlot,
  onRescheduleEvent,
}: TransportServicesCalendarProps) {
  const calendarHostRef = useRef<HTMLDivElement | null>(null);
  const [schedulerSidePanelAnchorElement, setSchedulerSidePanelAnchorElement] =
    useState<HTMLElement | null>(null);
  const [isSchedulerSidePanelOpen, setIsSchedulerSidePanelOpen] =
    useState(false);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>(
    [],
  );
  const [includeEventsWithoutVolunteers, setIncludeEventsWithoutVolunteers] =
    useState(false);
  const [optimisticSchedulesByEventId, setOptimisticSchedulesByEventId] =
    useState<Record<string, OptimisticSchedule>>({});

  const sortedEvents = useMemo(
    () =>
      [...events].sort((left, right) => {
        const leftMs = new Date(left.scheduledAt).getTime();
        const rightMs = new Date(right.scheduledAt).getTime();

        if (!Number.isFinite(leftMs) && !Number.isFinite(rightMs)) {
          return 0;
        }

        if (!Number.isFinite(leftMs)) {
          return 1;
        }

        if (!Number.isFinite(rightMs)) {
          return -1;
        }

        return leftMs - rightMs;
      }),
    [events],
  );

  const renderableEvents = useMemo(
    () =>
      sortedEvents.filter((event) => {
        return dayjs(event.scheduledAt).isValid();
      }),
    [sortedEvents],
  );

  const volunteerOptions = useMemo(() => {
    const map = new Map<string, string>();

    renderableEvents.forEach((event) => {
      event.volunteers.forEach((volunteer) => {
        const volunteerId = volunteer.volunteerId?.trim();
        if (!volunteerId) {
          return;
        }

        const fullName = volunteer.fullName?.trim() || volunteerId;
        map.set(volunteerId, fullName);
      });
    });

    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) => left.label.localeCompare(right.label, "it"));
  }, [renderableEvents]);

  const filteredRenderableEvents = useMemo(() => {
    if (
      !isSchedulerSidePanelOpen ||
      (selectedVolunteerIds.length === 0 && !includeEventsWithoutVolunteers)
    ) {
      return renderableEvents;
    }

    const selectedSet = new Set(selectedVolunteerIds);
    return renderableEvents.filter((event) => {
      const hasSelectedVolunteer = event.volunteers.some((volunteer) =>
        selectedSet.has(volunteer.volunteerId),
      );
      const hasNoVolunteers = event.volunteers.length === 0;

      return (
        hasSelectedVolunteer ||
        (includeEventsWithoutVolunteers && hasNoVolunteers)
      );
    });
  }, [
    includeEventsWithoutVolunteers,
    isSchedulerSidePanelOpen,
    renderableEvents,
    selectedVolunteerIds,
  ]);

  const schedulerEvents = useMemo<SchedulerTransportEvent[]>(
    () =>
      filteredRenderableEvents.map((event) => {
        const optimisticSchedule = optimisticSchedulesByEventId[event.id];
        const parsedStartDate = dayjs(
          optimisticSchedule?.start ?? event.scheduledAt,
        ).toDate();
        const startMs = parsedStartDate.getTime();
        const parsedEndDate = dayjs(
          optimisticSchedule?.end ?? event.scheduledEnd,
        ).toDate();
        const parsedEndMs = parsedEndDate?.getTime() ?? Number.NaN;
        const safeEndDate =
          Number.isFinite(parsedEndMs) && parsedEndMs > startMs
            ? new Date(parsedEndMs)
            : new Date(startMs + 1000 * 60 * 60);

        const tokenClassName = `${EVENT_TOKEN_CLASS_PREFIX}${toEventClassToken(event.id)}`;

        return {
          id: event.id,
          title: buildCalendarEventTitle(event),
          start: new Date(startMs).toISOString(),
          end: safeEndDate.toISOString(),
          color: toSchedulerColor(event.status),
          draggable: event.canMove,
          resizable: event.canMove,
          readOnly: !event.canMove,
          className:
            event.id === selectedEventId
              ? `${tokenClassName} transport-scheduler-event-selected`
              : tokenClassName,
        };
      }),
    [filteredRenderableEvents, optimisticSchedulesByEventId, selectedEventId],
  );

  useEffect(() => {
    if (Object.keys(optimisticSchedulesByEventId).length === 0) {
      return;
    }

    const eventsById = new Map(events.map((event) => [event.id, event]));

    setOptimisticSchedulesByEventId((current) => {
      let hasChanges = false;
      const next = { ...current };

      Object.entries(current).forEach(([eventId, optimisticSchedule]) => {
        const sourceEvent = eventsById.get(eventId);
        if (!sourceEvent) {
          delete next[eventId];
          hasChanges = true;
          return;
        }

        const serverStart = dayjs(sourceEvent.scheduledAt);
        const serverEnd = dayjs(
          sourceEvent.scheduledEnd ??
            dayjs(sourceEvent.scheduledAt).add(1, "hour"),
        );
        const optimisticStart = dayjs(optimisticSchedule.start);
        const optimisticEnd = dayjs(optimisticSchedule.end);

        const isAlignedWithServer =
          serverStart.isValid() &&
          serverEnd.isValid() &&
          optimisticStart.isValid() &&
          optimisticEnd.isValid() &&
          serverStart.toISOString() === optimisticStart.toISOString() &&
          serverEnd.toISOString() === optimisticEnd.toISOString();

        if (isAlignedWithServer) {
          delete next[eventId];
          hasChanges = true;
        }
      });

      return hasChanges ? next : current;
    });
  }, [events, optimisticSchedulesByEventId]);

  const eventTooltipById = useMemo(() => {
    return new Map(
      filteredRenderableEvents.map((event) => {
        const clientLabel = toClientLabel(event) ?? "Non specificato";
        const destinationLabel = toDestinationLabel(event) ?? "Non specificata";
        const vehicleLabel = toVehicleLabel(event);
        const volunteersLabel =
          event.volunteers.length > 0
            ? event.volunteers
                .map((volunteer) => volunteer.fullName.trim())
                .filter(Boolean)
                .join(", ")
            : "Nessuno";
        const tooltipLines = [
          buildCalendarEventTitle(event),
          `Cliente: ${clientLabel}`,
          `Destinazione: ${destinationLabel}`,
          `Tipologia: ${getTransportTypeLabel(event.transportType)}`,
          `Stato: ${getTransportStatusLabel(event.status)}`,
          `Orario: ${formatEventTimeRange(event)}`,
          `Volontari: ${volunteersLabel}`,
        ];

        if (vehicleLabel) {
          tooltipLines.splice(3, 0, `Veicolo: ${vehicleLabel}`);
        }

        const tooltip = tooltipLines.join("\n");

        return [event.id, tooltip];
      }),
    );
  }, [filteredRenderableEvents]);

  const schedulerEventsById = useMemo(
    () => new Map(schedulerEvents.map((event) => [event.id, event])),
    [schedulerEvents],
  );

  const schedulerEventIdByToken = useMemo(
    () =>
      new Map(
        filteredRenderableEvents.map((event) => [
          toEventClassToken(event.id),
          event.id,
        ]),
      ),
    [filteredRenderableEvents],
  );

  const calendarVisibleDate = useMemo(() => {
    const parsedVisibleDate = dayjs(visibleDateIso);
    if (parsedVisibleDate.isValid()) {
      return parsedVisibleDate.toDate();
    }

    return new Date();
  }, [visibleDateIso]);

  const extractSeedDateIso = (
    target: HTMLElement,
    pointer?: { clientY: number },
  ) => {
    const container = target.closest<HTMLElement>(".MuiEventCalendar-root");
    const chain: HTMLElement[] = [];

    let current: HTMLElement | null = target;
    while (current) {
      chain.push(current);
      if (container && current === container) {
        break;
      }

      current = current.parentElement;
    }

    let closestDateOnly: string | null = null;
    let closestTimeOnly: string | null = null;

    for (const element of chain) {
      const directDateTimeCandidates = [
        element.getAttribute("data-start"),
        element.getAttribute("datetime"),
        element.getAttribute("data-date"),
        element.getAttribute("data-time"),
      ];

      for (const rawCandidate of directDateTimeCandidates) {
        const candidate = rawCandidate?.trim();
        if (!candidate) {
          continue;
        }

        if (isDateOnlyValue(candidate)) {
          closestDateOnly = closestDateOnly ?? candidate;
          continue;
        }

        if (isTimeOnlyValue(candidate)) {
          closestTimeOnly = closestTimeOnly ?? toNormalizedTimeValue(candidate);
          continue;
        }

        const parsed = dayjs(candidate);
        if (parsed.isValid()) {
          return parsed.toISOString();
        }
      }
    }

    if (closestDateOnly && closestTimeOnly) {
      const combined = dayjs(`${closestDateOnly}T${closestTimeOnly}`);
      if (combined.isValid()) {
        return combined.toISOString();
      }
    }

    if (view === "month") {
      const monthCell = target.closest<HTMLElement>(
        ".MuiEventCalendar-monthViewCell",
      );

      if (monthCell) {
        const monthCellDateCandidates = [
          monthCell.getAttribute("data-start"),
          monthCell.getAttribute("datetime"),
          monthCell.getAttribute("data-date"),
        ];

        const parsedFromCandidate = monthCellDateCandidates
          .map((rawCandidate) => rawCandidate?.trim())
          .filter((candidate): candidate is string => Boolean(candidate))
          .map((candidate) => dayjs(candidate))
          .find((candidate) => candidate.isValid());

        if (parsedFromCandidate) {
          return parsedFromCandidate.startOf("day").toISOString();
        }

        const dayLabelElement =
          monthCell.querySelector<HTMLElement>(
            ".MuiEventCalendar-monthViewCellNumber",
          ) ??
          target.closest<HTMLElement>(".MuiEventCalendar-monthViewCellNumber");
        const dayOfMonth = parseDayNumberFromText(dayLabelElement?.textContent);

        if (dayOfMonth) {
          const visibleMonthDate = dayjs(calendarVisibleDate);
          let monthBase = visibleMonthDate.startOf("month");

          if (monthCell.hasAttribute("data-other-month")) {
            const row = monthCell.closest<HTMLElement>(
              ".MuiEventCalendar-monthViewRow",
            );
            const monthBody = row?.parentElement;
            const rows = monthBody
              ? Array.from(
                  monthBody.querySelectorAll<HTMLElement>(
                    ".MuiEventCalendar-monthViewRow",
                  ),
                )
              : [];
            const rowIndex = row ? rows.indexOf(row) : -1;

            if (rowIndex >= 0) {
              monthBase = monthBase.add(rowIndex <= 1 ? -1 : 1, "month");
            } else {
              monthBase = monthBase.add(dayOfMonth >= 20 ? -1 : 1, "month");
            }
          }

          const parsedMonthCell = monthBase.date(dayOfMonth).startOf("day");
          if (parsedMonthCell.isValid()) {
            return parsedMonthCell.toISOString();
          }
        }
      }
    }

    if (view === "day" || view === "week") {
      const slotCell = target.closest<HTMLElement>("[role='gridcell']");
      if (slotCell && pointer) {
        const rect = slotCell.getBoundingClientRect();
        if (rect.height > 0) {
          const clampedY = Math.min(
            Math.max(pointer.clientY, rect.top),
            rect.bottom,
          );
          const dayProgress = (clampedY - rect.top) / rect.height;
          const totalMinutes = 24 * 60;
          const snappedMinutes = Math.min(
            totalMinutes - 1,
            Math.max(0, Math.round((dayProgress * totalMinutes) / 15) * 15),
          );

          const slotDateCandidates = [
            slotCell.getAttribute("data-start"),
            slotCell.getAttribute("datetime"),
            slotCell.getAttribute("data-date"),
          ];

          const baseDayFromCell = slotDateCandidates
            .map((rawCandidate) => rawCandidate?.trim())
            .filter((candidate): candidate is string => Boolean(candidate))
            .map((candidate) => dayjs(candidate))
            .find((candidate) => candidate.isValid());

          let baseDay =
            view === "week"
              ? startOfSchedulerWeek(dayjs(calendarVisibleDate))
              : dayjs(calendarVisibleDate).startOf("day");

          if (baseDayFromCell) {
            baseDay = baseDayFromCell.startOf("day");
          } else if (view === "week") {
            let safeColumnIndex = 0;
            const dayTimeColumn = target.closest<HTMLElement>(
              ".MuiEventCalendar-dayTimeGridColumn",
            );

            if (dayTimeColumn && container) {
              const allColumns = Array.from(
                container.querySelectorAll<HTMLElement>(
                  ".MuiEventCalendar-dayTimeGridColumn",
                ),
              );
              const columnIndex = allColumns.indexOf(dayTimeColumn);
              if (columnIndex >= 0) {
                safeColumnIndex = Math.min(columnIndex, 6);
              }
            } else {
              const labelledBy = slotCell.getAttribute("aria-labelledby") ?? "";
              const dayMatch = labelledBy.match(
                /DayTimeGridHeaderCell-(\d{1,2})/,
              );
              const dayOfMonth = dayMatch
                ? Number.parseInt(dayMatch[1] ?? "", 10)
                : Number.NaN;

              if (Number.isInteger(dayOfMonth)) {
                const weekStart = startOfSchedulerWeek(
                  dayjs(calendarVisibleDate),
                );
                const derivedColumn = Array.from({ length: 7 }).findIndex(
                  (_, index) =>
                    weekStart.add(index, "day").date() === dayOfMonth,
                );

                if (derivedColumn >= 0) {
                  safeColumnIndex = derivedColumn;
                }
              }
            }

            baseDay = startOfSchedulerWeek(dayjs(calendarVisibleDate)).add(
              safeColumnIndex,
              "day",
            );
          }

          const fromGridCell = baseDay
            .startOf("day")
            .add(snappedMinutes, "minute");

          if (fromGridCell.isValid()) {
            return fromGridCell.toISOString();
          }
        }
      }
    }

    if (closestDateOnly) {
      const parsedDate = dayjs(closestDateOnly);
      if (parsedDate.isValid()) {
        return parsedDate.toISOString();
      }
    }

    if (closestTimeOnly) {
      const visibleDate = dayjs(calendarVisibleDate).format("YYYY-MM-DD");
      const combined = dayjs(`${visibleDate}T${closestTimeOnly}`);
      if (combined.isValid()) {
        return combined.toISOString();
      }
    }

    return calendarVisibleDate.toISOString();
  };

  const getEventIdFromTarget = (target: HTMLElement) => {
    const container = target.closest(".MuiEventCalendar-root");
    if (!(container instanceof HTMLElement)) {
      return null;
    }

    let current: HTMLElement | null = target;
    while (current && current !== container) {
      const tokenClass = Array.from(current.classList).find((className) =>
        className.startsWith(EVENT_TOKEN_CLASS_PREFIX),
      );

      if (tokenClass) {
        const token = tokenClass.slice(EVENT_TOKEN_CLASS_PREFIX.length);
        return schedulerEventIdByToken.get(token) ?? null;
      }

      current = current.parentElement;
    }

    return null;
  };

  const handleSchedulerEventClickCapture = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const container = target.closest(".MuiEventCalendar-root");
    if (!(container instanceof HTMLElement)) {
      return;
    }

    if (target.closest(".MuiEventCalendar-headerToolbar")) {
      return;
    }

    const eventId = getEventIdFromTarget(target);
    if (eventId) {
      event.preventDefault();
      event.stopPropagation();
      onSelectEvent(eventId);
      onOpenEventDetail(eventId);
      return;
    }

    if (target.closest(".MuiEventCalendar-sidePanel")) {
      return;
    }

    if (
      target.closest(
        "button, a, input, textarea, select, [aria-haspopup='menu']",
      )
    ) {
      return;
    }

    if (target.closest(".MuiEventCalendar-mainPanel")) {
      event.preventDefault();
      event.stopPropagation();
      onCreateSlot(
        extractSeedDateIso(target, {
          clientY: event.clientY,
        }),
      );
    }
  };

  const toIsoOrNull = (value: unknown) => {
    const fromDateLike = dayjs(value as string | number | Date);
    if (fromDateLike.isValid()) {
      return fromDateLike.toDate().toISOString();
    }

    if (
      typeof value === "object" &&
      value !== null &&
      "toISOString" in value &&
      typeof value.toISOString === "function"
    ) {
      const parsedFromIsoMethod = dayjs(value.toISOString() as string);
      if (parsedFromIsoMethod.isValid()) {
        return parsedFromIsoMethod.toDate().toISOString();
      }
    }

    if (
      typeof value === "object" &&
      value !== null &&
      "epochMilliseconds" in value &&
      typeof value.epochMilliseconds === "number"
    ) {
      const parsedFromEpoch = dayjs(value.epochMilliseconds);
      if (parsedFromEpoch.isValid()) {
        return parsedFromEpoch.toDate().toISOString();
      }
    }

    if (
      typeof value === "object" &&
      value !== null &&
      "toInstant" in value &&
      typeof value.toInstant === "function"
    ) {
      try {
        const instant = value.toInstant() as {
          epochMilliseconds?: number;
          toString?: () => string;
        };

        if (typeof instant?.epochMilliseconds === "number") {
          const parsedFromInstantEpoch = dayjs(instant.epochMilliseconds);
          if (parsedFromInstantEpoch.isValid()) {
            return parsedFromInstantEpoch.toDate().toISOString();
          }
        }

        if (typeof instant?.toString === "function") {
          const parsedFromInstantString = dayjs(instant.toString());
          if (parsedFromInstantString.isValid()) {
            return parsedFromInstantString.toDate().toISOString();
          }
        }
      } catch {
        // Ignore conversion failures and continue with string fallback.
      }
    }

    if (typeof value === "object" && value !== null) {
      const parsedFromToString = dayjs(String(value));
      if (parsedFromToString.isValid()) {
        return parsedFromToString.toDate().toISOString();
      }
    }

    return null;
  };

  const schedulerLocaleText = useMemo(
    () => ({
      today: "Oggi",
      day: "Giorno",
      week: "Settimana",
      month: "Mese",
      agenda: "Agenda",
      previousTimeSpan: () => "Indietro",
      nextTimeSpan: () => "Avanti",
      openSidePanel: "Apri pannello",
      closeSidePanel: "Chiudi pannello",
      preferencesMenu: "Preferenze",
      amPm12h: "12h",
      hour24h: "24h",
      timeFormat: "Formato orario",
      showWeekends: "Mostra weekend",
      showWeekNumber: "Mostra numero settimana",
    }),
    [],
  );

  useEffect(() => {
    const host = calendarHostRef.current;
    if (!host) {
      return;
    }

    const root = host.querySelector<HTMLElement>(".MuiEventCalendar-root");
    if (!root) {
      return;
    }

    const syncOpenState = () => {
      const contentElement = root.querySelector<HTMLElement>(
        "[data-side-panel-open]",
      );
      const attrValue = contentElement?.getAttribute("data-side-panel-open");
      const nextOpen = attrValue === "true";
      const sidePanelElement = root.querySelector<HTMLElement>(
        ".MuiEventCalendar-sidePanel",
      );

      let anchorElement: HTMLElement | null = null;
      if (sidePanelElement) {
        const existingAnchor = sidePanelElement.querySelector<HTMLElement>(
          ".transport-volunteer-panel-anchor",
        );
        const dividerElement = sidePanelElement.querySelector<HTMLElement>(
          ".MuiEventCalendar-sidePanelDivider",
        );

        if (existingAnchor) {
          anchorElement = existingAnchor;
          if (
            dividerElement &&
            existingAnchor.nextElementSibling !== dividerElement
          ) {
            sidePanelElement.insertBefore(existingAnchor, dividerElement);
          }
        } else {
          const createdAnchor = document.createElement("div");
          createdAnchor.className = "transport-volunteer-panel-anchor";
          if (dividerElement) {
            sidePanelElement.insertBefore(createdAnchor, dividerElement);
          } else {
            sidePanelElement.appendChild(createdAnchor);
          }
          anchorElement = createdAnchor;
        }
      }

      setSchedulerSidePanelAnchorElement(anchorElement);

      setIsSchedulerSidePanelOpen((current) => {
        if (current && !nextOpen) {
          setSelectedVolunteerIds([]);
          setIncludeEventsWithoutVolunteers(false);
        }

        return nextOpen;
      });
    };

    syncOpenState();

    const observer = new MutationObserver(syncOpenState);
    observer.observe(root, {
      attributes: true,
      subtree: true,
      childList: true,
      attributeFilter: ["data-side-panel-open", "class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const host = calendarHostRef.current;
    if (!host) {
      return;
    }

    const applyEventTooltips = () => {
      schedulerEventIdByToken.forEach((eventId, token) => {
        const tooltip = eventTooltipById.get(eventId);
        if (!tooltip) {
          return;
        }

        const eventElements = host.querySelectorAll<HTMLElement>(
          `.${EVENT_TOKEN_CLASS_PREFIX}${token}`,
        );

        eventElements.forEach((element) => {
          element.setAttribute("title", tooltip);
        });
      });
    };

    applyEventTooltips();

    const observer = new MutationObserver(applyEventTooltips);
    observer.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, [eventTooltipById, schedulerEventIdByToken]);

  const volunteerPanelContent =
    isSchedulerSidePanelOpen && schedulerSidePanelAnchorElement
      ? createPortal(
          <Box
            sx={{
              mt: 1.25,
              width: "100%",
              maxWidth: 272,
              borderTop: "1px solid",
              borderColor: "divider",
              pt: 1.25,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography
                variant="sectionEyebrow"
                sx={{ fontSize: 11, paddingLeft: 0.5 }}
              >
                Volontari
              </Typography>
            </Stack>
            <Stack spacing={1}>
              <FormGroup
                sx={{
                  px: 0,
                  py: 0,
                  maxHeight: 248,
                  overflowY: "auto",
                }}
              >
                <FormControlLabel
                  sx={{
                    m: 0,
                    px: 0.35,
                    py: 0.25,
                    borderRadius: 1.25,
                    "&:hover": { backgroundColor: "rgba(15, 109, 122, 0.08)" },
                  }}
                  control={
                    <Checkbox
                      size="small"
                      checked={includeEventsWithoutVolunteers}
                      onChange={(_, checked) => {
                        setIncludeEventsWithoutVolunteers(checked);
                      }}
                    />
                  }
                  label="Nessun volontario"
                />
                {volunteerOptions.length > 0 ? (
                  volunteerOptions.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      sx={{
                        m: 0,
                        px: 0.35,
                        py: 0.25,
                        borderRadius: 1.25,
                        "&:hover": {
                          backgroundColor: "rgba(15, 109, 122, 0.08)",
                        },
                      }}
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedVolunteerIds.includes(option.id)}
                          onChange={(_, checked) => {
                            setSelectedVolunteerIds((current) => {
                              if (checked) {
                                return [...current, option.id];
                              }

                              return current.filter((id) => id !== option.id);
                            });
                          }}
                        />
                      }
                      label={option.label}
                    />
                  ))
                ) : (
                  <Typography
                    variant="bodySmall"
                    color="text.secondary"
                    sx={{ pl: 0.75, pt: 0.5, pb: 0.5 }}
                  >
                    Nessun volontario nel periodo visibile.
                  </Typography>
                )}
              </FormGroup>

              {(selectedVolunteerIds.length > 0 ||
                includeEventsWithoutVolunteers) &&
              filteredRenderableEvents.length === 0 ? (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    borderRadius: 0,
                    border: "1px dashed rgba(217, 95, 67, 0.38)",
                    backgroundColor: "rgba(217, 95, 67, 0.07)",
                    px: 1,
                    py: 0.75,
                  }}
                >
                  <Typography variant="bodySmall" color="text.secondary">
                    Nessun servizio nel periodo con il filtro corrente.
                  </Typography>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setSelectedVolunteerIds([]);
                      setIncludeEventsWithoutVolunteers(false);
                    }}
                  >
                    Azzera
                  </Button>
                </Stack>
              ) : null}
            </Stack>
          </Box>,
          schedulerSidePanelAnchorElement,
        )
      : null;

  return (
    <ContentCard className="rounded-none shadow-none backdrop-blur-none">
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              bgcolor: "var(--accent-soft)",
              color: "var(--accent-primary)",
            }}
          >
            <AccessTime sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="sectionEyebrow">Calendario trasporti</Typography>
        </Stack>

        {errorMessage ? <Alert severity="warning">{errorMessage}</Alert> : null}

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={1.5}>
            <Box
              ref={calendarHostRef}
              onClickCapture={handleSchedulerEventClickCapture}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 0,
                minHeight:
                  view === "month"
                    ? { xs: 900, md: 1120 }
                    : { xs: 520, md: 680 },
                "& .transport-scheduler-event-selected": {
                  boxShadow: "inset 0 0 0 2px rgba(13, 71, 161, 0.65)",
                },
              }}
            >
              <EventCalendar<SchedulerTransportEvent, object>
                events={schedulerEvents}
                view={view}
                views={["week", "day", "month", "agenda"]}
                visibleDate={calendarVisibleDate}
                defaultPreferences={{
                  ampm: false,
                  isSidePanelOpen: false,
                  showWeekends: true,
                  showWeekNumber: false,
                  showEmptyDaysInAgenda: true,
                }}
                preferencesMenuConfig={{
                  toggleAmpm: true,
                  toggleWeekendVisibility: true,
                  toggleWeekNumberVisibility: true,
                  toggleEmptyDaysInAgenda: true,
                }}
                localeText={schedulerLocaleText}
                onViewChange={(nextView) => {
                  if (
                    nextView === "day" ||
                    nextView === "week" ||
                    nextView === "month" ||
                    nextView === "agenda"
                  ) {
                    onViewChange(nextView);
                  }
                }}
                onVisibleDateChange={(nextDate) => {
                  const parsedNextDate = dayjs(nextDate as string | Date);

                  if (!parsedNextDate.isValid()) {
                    return;
                  }

                  onVisibleDateChange(parsedNextDate.toDate().toISOString());
                }}
                onEventsChange={(nextEvents) => {
                  const changed = nextEvents.find((nextEvent) => {
                    const previous = schedulerEventsById.get(nextEvent.id);
                    return (
                      Boolean(previous) &&
                      (previous?.start !== nextEvent.start ||
                        previous?.end !== nextEvent.end)
                    );
                  });

                  if (!changed) {
                    return;
                  }

                  const previous = schedulerEventsById.get(changed.id);
                  if (!previous || !previous.draggable) {
                    return;
                  }

                  const nextStartIso = toIsoOrNull(changed.start);
                  if (!nextStartIso) {
                    return;
                  }

                  const nextEndIsoRaw = toIsoOrNull(changed.end);
                  const nextEndIso =
                    nextEndIsoRaw ??
                    dayjs(nextStartIso).add(1, "hour").toISOString();

                  if (
                    nextStartIso !== previous.start ||
                    nextEndIso !== previous.end
                  ) {
                    setOptimisticSchedulesByEventId((current) => ({
                      ...current,
                      [changed.id]: {
                        start: nextStartIso,
                        end: nextEndIso,
                      },
                    }));

                    void (async () => {
                      const didReschedule = await onRescheduleEvent(
                        changed.id,
                        nextStartIso,
                        nextEndIso,
                      );

                      if (didReschedule) {
                        return;
                      }

                      setOptimisticSchedulesByEventId((current) => {
                        if (!current[changed.id]) {
                          return current;
                        }

                        const next = { ...current };
                        delete next[changed.id];
                        return next;
                      });
                    })();
                  }
                }}
                eventCreation={false}
                areEventsDraggable
                areEventsResizable
                sx={{
                  height: "100%",
                  "& .MuiEventCalendar-monthViewBody": {
                    gridAutoRows: "minmax(136px, 1fr)",
                  },
                  "& .MuiEventCalendar-monthViewCellEvents": {
                    maxHeight: "none",
                    overflow: "visible",
                  },
                }}
              />
            </Box>
            {volunteerPanelContent}
          </Stack>
        </LocalizationProvider>
      </Stack>
    </ContentCard>
  );
}
