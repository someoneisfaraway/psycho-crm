// Types for the database schema
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  notes?: string;
  encrypted_notes?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'archived';
}

export type NewClient = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

export type UpdateClient = Partial<Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export interface Session {
  id: string;
  client_id: string;
  user_id: string;
  session_number: number;
  date: string;
  start_time?: string;
  end_time?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'unpaid';
  payment_amount?: number;
  payment_type?: string;
  notes?: string;
  receipt_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  client_id?: string;
  session_id?: string;
  type: string;
  title: string;
  message: string;
  scheduled_at: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
}