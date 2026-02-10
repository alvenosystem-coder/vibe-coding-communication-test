// Alveno API typy (odpovědi z externího API)
export interface AlvenoEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  avatarId: string | null;
  jobTitle: string;
  personalNumber: string;
  isActive: boolean;
  isDisabled: boolean;
  operationId: string | null;
  workgroupId: string | null;
  gender: string;
  startDate: string | null;
  localization: string;
}

export interface AlvenoEmployeesResponse {
  items: AlvenoEmployee[];
  offset: number;
  limit: number;
  totalCount: number;
}

export interface AlvenoOperation {
  id: string;
  name: string;
  isDisabled: boolean;
}

export interface AlvenoOperationsResponse {
  items: AlvenoOperation[];
}

// Priorita oznámení
export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";

// Zaměstnanec z lokální DB (pro UI)
export interface EmployeeWithOperation {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  jobTitle: string;
  operationId: string | null;
  operation: { id: string; name: string } | null;
}
