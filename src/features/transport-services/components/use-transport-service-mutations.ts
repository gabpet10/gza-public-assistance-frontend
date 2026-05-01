import { useState, type Dispatch, type SetStateAction } from "react";
import { toApiUiError } from "@/core/api/errors";
import {
  acceptTransportService,
  assignTransportService,
  cancelTransportService,
  completeTransportService,
  createTransportService,
  removeVehicleFromTransportService,
  removeVolunteerFromTransportService,
  selfAssignVehicleToTransportService,
  selfAssignVolunteerToTransportService,
  selfRemoveVehicleFromTransportService,
  selfRemoveVolunteerFromTransportService,
  startTransportService,
  updateTransportService,
  updateTransportServiceSchedule,
} from "@/features/transport-services/api/transport-services-api";
import type {
  TransportService,
  TransportServiceFormData,
  TransportServiceVolunteer,
} from "@/features/transport-services/api/types";
import {
  toAssignTeamMembers,
  toConflictMessage,
  toScheduleUpdatePayload,
  toServiceDurationMs,
} from "./transport-services-workspace.helpers";

type ActionToast = {
  message: string;
  severity: "warning" | "error";
};

type UseTransportServiceMutationsInput = {
  sessionUserId?: string;
  scopedOrganizationId?: string;
  setSelectedServiceId: (id: string | null) => void;
  setSelectedServiceFallback: (service: TransportService | null) => void;
  setReloadKey: Dispatch<SetStateAction<number>>;
};

type AssignResourceMember = {
  volunteerId: string;
  role: TransportServiceVolunteer["role"];
};

export function useTransportServiceMutations({
  sessionUserId,
  scopedOrganizationId,
  setSelectedServiceId,
  setSelectedServiceFallback,
  setReloadKey,
}: UseTransportServiceMutationsInput) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<ActionToast | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const executeServiceAction = async (
    action: () => Promise<TransportService>,
    fallbackMessage: string,
  ): Promise<boolean> => {
    setActionError(null);
    setIsActionSubmitting(true);

    try {
      const updated = await action();
      setSelectedServiceId(updated.id);
      setSelectedServiceFallback(updated);
      setReloadKey((current) => current + 1);
      return true;
    } catch (error) {
      const uiError = toApiUiError(error, fallbackMessage);
      const conflictMessage = toConflictMessage(error);
      const userMessage = uiError.isConflict
        ? "Il servizio e stato aggiornato da un altro utente. Ricarico i dati."
        : (conflictMessage ?? uiError.userMessage);

      if (uiError.isConflict) {
        setReloadKey((current) => current + 1);
      }

      setActionError(userMessage);
      setActionToast({
        message: userMessage,
        severity:
          uiError.isBadRequest || uiError.isConflict ? "warning" : "error",
      });
      return false;
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const finalizeUpsertResult = (service: TransportService) => {
    setSelectedServiceId(service.id);
    setSelectedServiceFallback(service);
    setReloadKey((current) => current + 1);
  };

  const applyPostUpsertWorkflow = async (
    service: TransportService,
    values: TransportServiceFormData,
  ) => {
    let nextService = service;

    if (
      values.serviceStatus === "accepted" &&
      nextService.status === "pending"
    ) {
      nextService = await acceptTransportService(nextService.id);
    }

    const shouldAssignResources =
      values.vehicleId.trim().length > 0 && values.volunteerIds.length > 0;
    if (!shouldAssignResources) {
      return nextService;
    }

    if (!sessionUserId) {
      throw new Error(
        "Sessione utente non valida per assegnare le risorse del servizio.",
      );
    }

    if (nextService.status === "pending") {
      nextService = await acceptTransportService(nextService.id);
    }

    return assignTransportService(nextService.id, {
      vehicleId: values.vehicleId,
      assignedByUserId: sessionUserId,
      teamMembers: toAssignTeamMembers(
        values.volunteerIds,
        values.volunteerRoles,
      ),
      note: values.note || undefined,
      assignedAt: new Date().toISOString(),
    });
  };

  const createService = async (values: TransportServiceFormData) => {
    if (!scopedOrganizationId) {
      return;
    }

    const created = await createTransportService({
      organizationId: scopedOrganizationId,
      clientId: values.clientId,
      pickupDestinationId: values.pickupDestinationId,
      transportType: values.transportType,
      scheduledAt: values.scheduledAt,
      scheduledEnd: values.scheduledEnd,
      dropoffAddress: values.dropoffAddress,
      dropoffCity: values.dropoffCity,
      dropoffProvince: values.dropoffProvince,
      isPaid: values.isPaid,
      amount: values.amount,
      note: values.note || undefined,
    });

    const finalized = await applyPostUpsertWorkflow(created, values);
    finalizeUpsertResult(finalized);
  };

  const editService = async (
    selectedTransportService: TransportService,
    values: TransportServiceFormData,
  ) => {
    const updated = await updateTransportService(selectedTransportService.id, {
      organizationId:
        selectedTransportService.organizationId || scopedOrganizationId || "",
      clientId: values.clientId,
      pickupDestinationId: values.pickupDestinationId,
      transportType: values.transportType,
      scheduledAt: values.scheduledAt,
      scheduledEnd: values.scheduledEnd,
      dropoffAddress: values.dropoffAddress,
      dropoffCity: values.dropoffCity,
      dropoffProvince: values.dropoffProvince,
      isPaid: values.isPaid,
      amount: values.amount,
      note: values.note || undefined,
    });

    const finalized = await applyPostUpsertWorkflow(updated, values);
    finalizeUpsertResult(finalized);
  };

  const assignResources = async (
    serviceId: string,
    vehicleId: string,
    teamMembers: AssignResourceMember[],
    note: string,
  ) => {
    if (!sessionUserId) {
      return false;
    }

    return executeServiceAction(
      () =>
        assignTransportService(serviceId, {
          vehicleId,
          assignedByUserId: sessionUserId,
          teamMembers,
          note: note || undefined,
          assignedAt: new Date().toISOString(),
        }),
      "Assegnazione risorse non riuscita.",
    );
  };

  const shiftCalendarEvent = async (
    eventId: string,
    scheduledAt: string,
    scheduledEnd: string | null,
    minutesDelta: number,
    expectedVersion?: number,
  ) => {
    const startMs = new Date(scheduledAt).getTime();
    const durationMs = toServiceDurationMs(scheduledAt, scheduledEnd);
    const shiftedStartMs = startMs + minutesDelta * 60 * 1000;

    await executeServiceAction(
      () =>
        updateTransportServiceSchedule(
          eventId,
          toScheduleUpdatePayload(shiftedStartMs, durationMs, expectedVersion),
        ),
      "Spostamento evento non riuscito.",
    );
  };

  const rescheduleService = async (
    serviceId: string,
    scheduledAt: string,
    scheduledEnd: string | null,
    nextScheduledAt: string,
    expectedVersion?: number,
  ) => {
    const parsedStart = new Date(nextScheduledAt).getTime();
    const durationMs = toServiceDurationMs(scheduledAt, scheduledEnd);

    return executeServiceAction(
      () =>
        updateTransportServiceSchedule(
          serviceId,
          toScheduleUpdatePayload(parsedStart, durationMs, expectedVersion),
        ),
      "Ripianificazione non riuscita.",
    );
  };

  return {
    actionError,
    actionToast,
    isActionSubmitting,
    setActionError,
    setActionToast,
    createService,
    editService,
    executeServiceAction,
    assignResources,
    shiftCalendarEvent,
    rescheduleService,
    acceptService: (serviceId: string) =>
      executeServiceAction(
        () => acceptTransportService(serviceId),
        "Cambio stato in accettato non riuscito.",
      ),
    startService: (serviceId: string) =>
      executeServiceAction(
        () => startTransportService(serviceId),
        "Avvio servizio non riuscito.",
      ),
    completeService: (serviceId: string) =>
      executeServiceAction(
        () => completeTransportService(serviceId),
        "Completamento servizio non riuscito.",
      ),
    cancelService: (serviceId: string) =>
      executeServiceAction(
        () => cancelTransportService(serviceId),
        "Annullamento servizio non riuscito.",
      ),
    volunteerSelfAssign: (serviceId: string) =>
      executeServiceAction(
        () =>
          selfAssignVolunteerToTransportService(serviceId, {
            role: "attendant",
            assignedAt: new Date().toISOString(),
          }),
        "Auto-assegnazione non riuscita.",
      ),
    volunteerSelfRemove: (serviceId: string) =>
      executeServiceAction(
        () => selfRemoveVolunteerFromTransportService(serviceId),
        "Rimozione personale dal servizio non riuscita.",
      ),
    volunteerAssignVehicle: (
      serviceId: string,
      vehicleId: string,
      note: string,
    ) =>
      executeServiceAction(
        () =>
          selfAssignVehicleToTransportService(serviceId, {
            vehicleId,
            note: note || undefined,
            changedAt: new Date().toISOString(),
          }),
        "Aggiornamento veicolo non riuscito.",
      ),
    volunteerRemoveVehicle: (serviceId: string) =>
      executeServiceAction(
        () => selfRemoveVehicleFromTransportService(serviceId),
        "Rimozione veicolo non riuscita.",
      ),
    overrideRemoveVolunteer: (serviceId: string, volunteerId: string) =>
      executeServiceAction(
        () => removeVolunteerFromTransportService(serviceId, volunteerId),
        "Rimozione volontario non riuscita.",
      ),
    overrideRemoveVehicle: (serviceId: string) =>
      executeServiceAction(
        () => removeVehicleFromTransportService(serviceId),
        "Rimozione veicolo non riuscita.",
      ),
  };
}
