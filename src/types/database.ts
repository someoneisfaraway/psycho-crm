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
  notification_settings?: any; // Лучше заменить на конкретный тип, если структура известна
  subscription_plan?: string;
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  onboarding_completed?: boolean;
}

export interface Client {
  id: string; // Это client_id в ТЗ
  user_id: string;
  name: string;
  age?: number | null; // Может быть null в БД
  location?: string | null; // Может быть null в БД
  source: string; // 'private' | 'yasno' | 'zigmund' | 'alter' | 'other'
  type: string; // 'regular' | 'one-time'
  status: 'active' | 'paused' | 'completed';
  phone?: string | null; // Может быть null в БД
  email?: string | null; // Может быть null в БД
  telegram?: string | null; // Может быть null в БД
  session_price: number;
  payment_type: string; // 'self-employed' | 'ip' | 'cash' | 'platform'
  need_receipt?: boolean; // DEFAULT TRUE
  format: string; // 'online' | 'offline'
  total_sessions?: number; // DEFAULT 0
  total_paid?: number; // DEFAULT 0
  debt?: number; // DEFAULT 0
  created_at: string;
  last_session_at?: string | null; // Может быть null в БД
  next_session_at?: string | null; // Может быть null в БД
  notes_encrypted?: string | null; // Может быть null в БД
  updated_at: string;
}

// Тип для создания нового клиента: исключаем вычисляемые поля и те, что устанавливаются БД
// id может быть предоставлен или сгенерирован, поэтому опционален
// user_id должен быть предоставлен при создании
export type NewClient = Omit<Client, 'id' | 'total_sessions' | 'total_paid' | 'debt' | 'created_at' | 'updated_at'> & {
  id?: string; // Может быть предоставлен (например, для Ясно/Зигмунд) или сгенерирован
  user_id: string; // Должен быть передан при создании
  // Поля total_sessions, total_paid, debt, created_at, updated_at не включаем, так как БД/триггеры их установят
};

// Тип для обновления клиента: исключаем id и user_id
// created_at и updated_at обновляются триггером
export type UpdateClient = Partial<Omit<Client, 'id' | 'user_id'>>;

export interface Session {
  id: string;
  user_id: string;
  client_id: string;
  session_number: number;
  scheduled_at: string;
  completed_at?: string | null; // Может быть null в БД
  duration?: number; // DEFAULT 50
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed' | 'rescheduled';
  price: number;
  paid?: boolean; // DEFAULT FALSE
  paid_at?: string | null; // Может быть null в БД
  payment_method?: string | null; // 'card' | 'cash' | 'platform' | 'transfer'
  receipt_sent?: boolean; // DEFAULT FALSE
  receipt_sent_at?: string | null; // Может быть null в БД
  receipt_reminder?: boolean; // DEFAULT FALSE
  format: string; // 'online' | 'offline'
  meeting_link?: string | null; // Может быть null в БД
  note_encrypted?: string | null; // Может быть null в БД
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string; // 'session_reminder' | 'receipt_reminder' | 'debt_reminder' | 'system'
  related_type?: string | null; // 'session' | 'client'
  related_id?: string | null; // id сессии или клиента
  title: string;
  message: string;
  action_url?: string | null; // Может быть null в БД
  delivery_method: string; // 'email' | 'push' | 'telegram' | 'sms'
  scheduled_for: string;
  sent?: boolean; // DEFAULT FALSE
  sent_at?: string | null; // Может быть null в БД
  read?: boolean; // DEFAULT FALSE
  read_at?: string | null; // Может быть null в БД
  error?: string | null; // Может быть null в БД
  retry_count?: number; // DEFAULT 0
  created_at: string;
}