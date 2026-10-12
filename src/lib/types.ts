export type Role = "admin" | "employee" | "client";
export type EventStatus = "Planeamento" | "Produção" | "Em curso" | "Concluído" | "Cancelado";
export type ContractType = "Permanente" | "Freelancer";
export type PersonStatus = "Ativo" | "Inativo";

export interface Profile {
  id: string;
  org_id: string;
  full_name: string;
  email: string;
  role: Role;
  phone: string | null;
  avatar_color: string;
  job_title: string | null;
  department: string | null;
  skills: string[];
  availability: "Disponível" | "Ocupado" | "Ausente";
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  org_id: string;
  name: string;
  type: string;
  client: string | null;
  venue: string;
  event_date: string;
  guests: number;
  lead_id: string | null;
  status: EventStatus;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventService {
  id: string;
  event_id: string;
  label: string;
}

export interface EventTeamMember {
  id: string;
  event_id: string;
  profile_id: string;
  role_on_event: string | null;
}

export interface Task {
  id: string;
  event_id: string;
  label: string;
  responsible_id: string | null;
  deadline: string | null;
  done: boolean;
  created_at: string;
}

export interface Note {
  id: string;
  event_id: string;
  author_id: string;
  body: string;
  pinned: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  org_id: string;
  event_id: string | null;
  name: string;
  category: string;
  storage_path: string;
  uploaded_by: string | null;
  size_bytes: number;
  created_at: string;
}

export interface Shift {
  id: string;
  org_id: string;
  profile_id: string;
  event_id: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  role_on_shift: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export interface PeopleHr {
  profile_id: string;
  dob: string | null;
  address: string | null;
  personal_phone: string | null;
  personal_email: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  contract_type: ContractType;
  weekly_hours: number;
  rate: number;
  rate_unit: string;
  manager_id: string | null;
  iban: string | null;
  tax_id: string | null;
  bank_name: string | null;
  status: PersonStatus;
  start_date: string | null;
}

export interface HrDocument {
  id: string;
  profile_id: string;
  name: string;
  expiry: string | null;
  created_at: string;
}

export interface NotificationPrefs {
  profile_id: string;
  notif_email: boolean;
  notif_sms: boolean;
  notif_schedule: boolean;
  notif_docs: boolean;
}
