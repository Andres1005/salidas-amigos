export type PersonRole = "admin" | "member";
export type ApprovalStatus = "pendiente" | "aprobado" | "rechazado";
export type PlanStatus = "abierto" | "cerrado";
export type SplitMode = "equitativo" | "personalizado";
export type ActivityStatus = "pendiente" | "aprobada";
export type ExpenseCategory =
  | "alojamiento"
  | "transporte"
  | "comida"
  | "actividades"
  | "entradas"
  | "compras"
  | "otros";

export interface Person {
  id: string;
  full_name: string;
  email: string;
  role: PersonRole;
  status: ApprovalStatus;
  auth_user_id: string | null;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  destination: string | null;
  cover_emoji: string;
  start_date: string | null;
  end_date: string | null;
  status: PlanStatus;
  split_mode: SplitMode;
  join_code: string;
  created_by: string;
  closed_at: string | null;
  created_at: string;
}

export interface PlanParticipant {
  id: string;
  plan_id: string;
  person_id: string;
  share_weight: number;
  role_label: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  plan_id: string;
  name: string;
  description: string | null;
  activity_date: string | null;
  responsible_person_id: string | null;
  invited_person_id: string | null;
  estimated_cost_cop: number | null;
  actual_cost_cop: number | null;
  no_budget: boolean;
  status: ActivityStatus;
  proposed_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  plan_id: string;
  activity_id: string | null;
  description: string;
  category: ExpenseCategory;
  amount_cop: number;
  paid_by_person_id: string;
  created_by: string;
  expense_date: string;
  created_at: string;
}

export interface ActivityNote {
  id: string;
  activity_id: string;
  person_id: string;
  body: string;
  created_at: string;
}

export interface Settlement {
  id: string;
  plan_id: string;
  from_person_id: string;
  to_person_id: string;
  amount_cop: number;
  created_at: string;
}
