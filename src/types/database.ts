// Types for the database schema
export interface User {
  id: string;
  email: string;
 name?: string;
  business_type?: string;
  phone?: string;
  avatar_url?: string;
  default_session_price?: number;
  default_session_duration?: number;
  timezone?: string;
  notification_settings?: any;
  subscription_plan?: string;
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  onboarding_completed?: boolean;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
 age?: number;
  location?: string;
  source: string;
  type: string;
  status: 'active' | 'paused' | 'completed';
  phone?: string;
  email?: string;
  telegram?: string;
  session_price: number;
  payment_type: string;
  need_receipt?: boolean;
  format: string;
  total_sessions?: number;
  total_paid?: number;
  debt?: number;
  created_at: string;
  last_session_at?: string;
  next_session_at?: string;
  notes_encrypted?: string;
  updated_at: string;
}

export type NewClient = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

export type UpdateClient = Partial<Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export interface Session {
  id: string;
  user_id: string;
  client_id: string;
  session_number: number;
  scheduled_at: string;
  completed_at?: string;
  duration?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  price: number;
  paid?: boolean;
  paid_at?: string;
  payment_method?: string;
  receipt_sent?: boolean;
  receipt_sent_at?: string;
  receipt_reminder?: boolean;
  format: string;
  meeting_link?: string;
  note_encrypted?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  related_type?: string;
  related_id?: string;
  title: string;
  message: string;
 action_url?: string;
  delivery_method: string;
  scheduled_for: string;
  sent?: boolean;
  sent_at?: string;
  read?: boolean;
  read_at?: string;
  error?: string;
  retry_count?: number;
  created_at: string;
}