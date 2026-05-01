export type TransportType =
  | "sanitario"
  | "sociale"
  | "dimissione_ospedaliera"
  | "visita_programmata"
  | "dialisi"
  | "riabilitazione"
  | "trasferimento_struttura"
  | "accompagnamento_amministrativo";

export type TransportServiceStatus =
  | "pending"
  | "accepted"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TransportAssignmentRole = "driver" | "attendant";

export type TransportTeamMember = {
  volunteerId: string;
  role: TransportAssignmentRole;
};

export type TransportServiceVolunteer = {
  volunteerId: string;
  fullName: string;
  phone: string | null;
  role: TransportAssignmentRole;
};

export type TransportService = {
  id: string;
  organizationId: string;
  transportType: TransportType;
  status: TransportServiceStatus;
  scheduledAt: string;
  scheduledEnd: string | null;
  scheduleVersion: number;
  clientId: string;
  clientDisplayName: string;
  pickupDestinationId: string;
  pickupDestinationDisplayName: string;
  dropoffAddress: string;
  dropoffCity: string;
  dropoffProvince: string;
  note: string | null;
  isPaid: boolean;
  amount: number | null;
  vehicleId: string | null;
  vehiclePlateNumber: string | null;
  vehicleType: string | null;
  vehicleDisplayName: string | null;
  vehicleDescription: string | null;
  vehicleNote: string | null;
  vehicleCreatedAt: string | null;
  volunteers: TransportServiceVolunteer[];

  // Legacy fields kept for compatibility during backend transition.
  assignedVolunteerIds: string[];
  assignedVolunteerNames: string[];
  teamMemberCount: number;
  acceptedAt: string | null;
  assignedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export type TransportServiceVolunteerDto = {
  volunteerId?: string;
  fullName?: string;
  phone?: string | null;
  role?: string;
};

export type TransportServiceDto = {
  id?: string;
  organizationId?: string;
  transportType?: string;
  status?: string;
  scheduledAt?: string;
  scheduledEnd?: string | null;
  scheduleVersion?: number;
  clientId?: string | null;
  clientFirstName?: string | null;
  clientLastName?: string | null;
  clientDisplayName?: string | null;
  clientFullName?: string | null;
  pickupDestinationId?: string | null;
  pickupDestinationAddress?: string | null;
  pickupDestinationCity?: string | null;
  pickupDestinationProvince?: string | null;
  pickupDestinationDisplayName?: string | null;
  pickupDestinationName?: string | null;
  dropoffAddress?: string | null;
  dropoffCity?: string | null;
  dropoffProvince?: string | null;
  note?: string | null;
  isPaid?: boolean;
  amount?: number | null;
  vehicleId?: string | null;
  vehiclePlateNumber?: string | null;
  vehicleType?: string | null;
  vehicleDescription?: string | null;
  vehicleNote?: string | null;
  vehicleDisplayName?: string | null;
  vehicleCreatedAt?: string | null;
  volunteers?: TransportServiceVolunteerDto[] | null;
  assignedVolunteerIds?: string[] | null;
  assignedVolunteerNames?: string[] | null;
  volunteerNames?: string | null;
  acceptedAt?: string | null;
  assignedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;

  title?: string;
  teamMemberCount?: number;
  createdAt?: string;
};

export type TransportServicePagedResultDto = {
  items?: TransportServiceDto[];
  pageIndex?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
};

export type TransportCalendarEvent = {
  id: string;
  organizationId: string;
  transportType: TransportType;
  clientId: string;
  clientFirstName: string | null;
  clientLastName: string | null;
  clientFullName: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  clientCity: string | null;
  clientProvince: string | null;
  clientNotes: string | null;
  clientCreatedAt: string | null;
  clientDisplayName: string | null;
  pickupDestinationId: string;
  pickupDestinationName: string | null;
  pickupDestinationDescription: string | null;
  pickupDestinationAddress: string | null;
  pickupDestinationCity: string | null;
  pickupDestinationProvince: string | null;
  pickupDestinationNotes: string | null;
  pickupDestinationCreatedAt: string | null;
  pickupDestinationDisplayName: string | null;
  dropoffAddress: string;
  dropoffCity: string;
  dropoffProvince: string;
  title: string;
  scheduledAt: string;
  scheduledEnd: string | null;
  scheduleVersion: number;
  status: TransportServiceStatus;
  note: string | null;
  isPaid: boolean;
  amount: number | null;
  vehicleId: string | null;
  vehiclePlateNumber: string | null;
  vehicleType: string | null;
  vehicleDescription: string | null;
  vehicleNote: string | null;
  vehicleCreatedAt: string | null;
  vehicleDisplayName: string | null;
  volunteers: TransportServiceVolunteer[];
  teamMemberCount: number;
  createdAt: string;
  assignedAt: string | null;
  cancelledAt: string | null;
  canMove: boolean;
  canAssign: boolean;
  canCancel: boolean;
};

export type TransportCalendarEventDto = {
  id?: string;
  organizationId?: string;
  transportType?: string;
  clientId?: string;
  clientFirstName?: string | null;
  clientLastName?: string | null;
  clientDisplayName?: string | null;
  clientFullName?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  clientCity?: string | null;
  clientProvince?: string | null;
  clientNotes?: string | null;
  clientCreatedAt?: string | null;
  pickupDestinationId?: string;
  pickupDestinationName?: string | null;
  pickupDestinationDisplayName?: string | null;
  pickupDestinationDescription?: string | null;
  pickupDestinationAddress?: string | null;
  pickupDestinationCity?: string | null;
  pickupDestinationProvince?: string | null;
  pickupDestinationNotes?: string | null;
  pickupDestinationCreatedAt?: string | null;
  dropoffAddress?: string;
  dropoffCity?: string;
  dropoffProvince?: string;
  title?: string;
  scheduledAt?: string;
  scheduledEnd?: string | null;
  scheduleVersion?: number;
  status?: string;
  note?: string | null;
  isPaid?: boolean;
  amount?: number | null;
  vehicleId?: string | null;
  vehiclePlateNumber?: string | null;
  vehicleType?: string | null;
  vehicleDescription?: string | null;
  vehicleNote?: string | null;
  vehicleCreatedAt?: string | null;
  vehicleDisplayName?: string | null;
  volunteers?: TransportServiceVolunteerDto[] | null;
  teamMemberCount?: number;
  createdAt?: string;
  assignedAt?: string | null;
  cancelledAt?: string | null;
  canMove?: boolean;
  canAssign?: boolean;
  canCancel?: boolean;
};

export type TransportServiceUpsertInput = {
  organizationId: string;
  clientId: string;
  pickupDestinationId: string;
  transportType: TransportType;
  scheduledAt: string;
  scheduledEnd?: string | null;
  dropoffAddress: string;
  dropoffCity: string;
  dropoffProvince: string;
  isPaid: boolean;
  amount?: number | null;
  note?: string;
};

export type TransportServiceFormData = {
  clientId: string;
  clientLabel: string;
  pickupDestinationId: string;
  pickupDestinationLabel: string;
  transportType: TransportType;
  scheduledAt: string;
  scheduledEnd: string | null;
  serviceStatus: TransportServiceStatus;
  dropoffAddress: string;
  dropoffCity: string;
  dropoffProvince: string;
  vehicleId: string;
  vehicleLabel: string;
  vehicleSecondaryLabel: string;
  volunteerIds: string[];
  volunteerLabels: string[];
  volunteerRoles: TransportAssignmentRole[];
  isPaid: boolean;
  amount: number | null;
  note: string;
};

export type TransportServiceUpsertRequestDto = {
  organizationId?: string | null;
  clientId?: string | null;
  pickupDestinationId?: string | null;
  transportType?: string | null;
  scheduledAt?: string | null;
  scheduledEnd?: string | null;
  dropoffAddress?: string | null;
  dropoffCity?: string | null;
  dropoffProvince?: string | null;
  isPaid?: boolean | null;
  amount?: number | null;
  note?: string | null;
};

export type AssignTransportServiceInput = {
  vehicleId: string;
  assignedByUserId: string;
  teamMembers: TransportTeamMember[];
  note?: string;
  assignedAt?: string;
};

export type AssignTransportServiceRequestDto = {
  vehicleId?: string | null;
  assignedByUserId?: string | null;
  teamMembers?: Array<{
    volunteerId?: string | null;
    role?: string | null;
  }>;
  note?: string | null;
  assignedAt?: string | null;
};

export type SelfAssignTransportServiceInput = {
  role?: TransportAssignmentRole;
  assignedAt?: string;
};

export type SelfAssignTransportServiceRequestDto = {
  role?: string | null;
  assignedAt?: string | null;
};

export type AssignVehicleAsVolunteerInput = {
  vehicleId: string;
  note?: string;
  changedAt?: string;
};

export type AssignVehicleAsVolunteerRequestDto = {
  vehicleId?: string | null;
  note?: string | null;
  changedAt?: string | null;
};

export type RescheduleTransportServiceInput = {
  scheduledAt: string;
};

export type RescheduleTransportServiceRequestDto = {
  scheduledAtUtc?: string | null;
};

export type UpdateTransportServiceScheduleInput = {
  scheduledAt: string;
  scheduledEnd: string;
  timezone: string;
  expectedVersion?: number;
};

export type UpdateTransportServiceScheduleRequestDto = {
  startUtc?: string | null;
  endUtc?: string | null;
  timezone?: string | null;
  expectedVersion?: number | null;
};
