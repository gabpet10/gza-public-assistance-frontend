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
  getTransportPriorityLabel,
  getTransportStatusLabel,
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
  onCreateSlot: (seedDateIso: string) => void;
  onShiftEvent: (eventId: string, minutesDelta: number) => void;
};

type SchedulerTransportEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  color: "amber" | "green" | "blue" | "indigo" | "teal" | "grey";
  draggable: boolean;
  resizable: false;
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

export function TransportServicesCalendar({
  events,
  errorMessage,
  selectedEventId,
  view,
  visibleDateIso,
  onViewChange,
  onVisibleDateChange,
  onSelectEvent,
  onCreateSlot,
  onShiftEvent,
}: TransportServicesCalendarProps) {
  const calendarHostRef = useRef<HTMLDivElement | null>(null);
  const [schedulerSidePanelAnchorElement, setSchedulerSidePanelAnchorElement] =
    useState<HTMLElement | null>(null);
  const [isSchedulerSidePanelOpen, setIsSchedulerSidePanelOpen] =
    useState(false);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>(
    [],
  );

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
    if (!isSchedulerSidePanelOpen || selectedVolunteerIds.length === 0) {
      return renderableEvents;
    }

    const selectedSet = new Set(selectedVolunteerIds);
    return renderableEvents.filter((event) =>
      event.volunteers.some((volunteer) =>
        selectedSet.has(volunteer.volunteerId),
      ),
    );
  }, [isSchedulerSidePanelOpen, renderableEvents, selectedVolunteerIds]);

  const schedulerEvents = useMemo<SchedulerTransportEvent[]>(
    () =>
      filteredRenderableEvents.map((event) => {
        const startDate = dayjs(event.scheduledAt).toDate();
        const startMs = startDate.getTime();
        const parsedEndDate = event.scheduledEnd
          ? dayjs(event.scheduledEnd).toDate()
          : null;
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
          resizable: false,
          readOnly: !event.canMove,
          className:
            event.id === selectedEventId
              ? `${tokenClassName} transport-scheduler-event-selected`
              : tokenClassName,
        };
      }),
    [filteredRenderableEvents, selectedEventId],
  );

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
          `Stato: ${getTransportStatusLabel(event.status)}`,
          `Priorita: ${getTransportPriorityLabel(event.priority)}`,
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

  const extractSeedDateIso = (target: HTMLElement) => {
    const slotElement = target.closest<HTMLElement>(
      "[data-start], [data-date], [data-time], [datetime], .MuiEventCalendar-dayGridCell, .MuiEventCalendar-dayTimeGridCell, .MuiEventCalendar-timeGridCell",
    );

    const candidateValues = [
      slotElement?.getAttribute("data-start"),
      slotElement?.getAttribute("data-date"),
      slotElement?.getAttribute("data-time"),
      slotElement?.getAttribute("datetime"),
    ];

    for (const candidate of candidateValues) {
      if (!candidate) {
        continue;
      }

      const parsed = dayjs(candidate);
      if (parsed.isValid()) {
        return parsed.toISOString();
      }
    }

    return calendarVisibleDate.toISOString();
  };

  const handleSchedulerClickCapture = (
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

    let current: HTMLElement | null = target;
    while (current && current !== container) {
      const tokenClass = Array.from(current.classList).find((className) =>
        className.startsWith(EVENT_TOKEN_CLASS_PREFIX),
      );

      if (tokenClass) {
        const token = tokenClass.slice(EVENT_TOKEN_CLASS_PREFIX.length);
        const eventId = schedulerEventIdByToken.get(token);
        if (eventId) {
          event.preventDefault();
          event.stopPropagation();
          onSelectEvent(eventId);
        }
        return;
      }

      current = current.parentElement;
    }

    if (target.closest(".MuiEventCalendar-sidePanel")) {
      return;
    }

    if (
      target.closest(
        "button, a, input, textarea, select, [role='button'], [aria-haspopup='menu']",
      )
    ) {
      return;
    }

    if (target.closest(".MuiEventCalendar-mainPanel")) {
      event.preventDefault();
      event.stopPropagation();
      onCreateSlot(extractSeedDateIso(target));
    }
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
            <Typography variant="sectionEyebrow" sx={{ fontSize: 11, mb: 1 }}>
              Volontari
            </Typography>
            {volunteerOptions.length > 0 ? (
              <Stack spacing={1}>
                <FormGroup>
                  {volunteerOptions.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      sx={{ m: 0, py: 0.15 }}
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
                  ))}
                </FormGroup>

                {selectedVolunteerIds.length > 0 &&
                filteredRenderableEvents.length === 0 ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="bodySmall" color="text.secondary">
                      Nessun servizio nel periodo con il filtro corrente.
                    </Typography>
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => setSelectedVolunteerIds([])}
                    >
                      Azzera
                    </Button>
                  </Stack>
                ) : null}
              </Stack>
            ) : null}
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
              onClickCapture={handleSchedulerClickCapture}
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

                  const newStartMs = new Date(
                    changed.start as string | number | Date,
                  ).getTime();
                  const previousStartMs = new Date(previous.start).getTime();
                  if (
                    !Number.isFinite(newStartMs) ||
                    !Number.isFinite(previousStartMs)
                  ) {
                    return;
                  }

                  const minutesDelta = Math.round(
                    (newStartMs - previousStartMs) / (1000 * 60),
                  );
                  if (minutesDelta !== 0) {
                    onShiftEvent(changed.id, minutesDelta);
                  }
                }}
                eventCreation={false}
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
