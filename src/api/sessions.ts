import { supabase } from '../config/supabase';

export interface Session {
 id: string;
  client_id: string;
  user_id: string;
  session_number: number;
  date: string;
  start_time?: string;
  end_time?: string;
  status: string;
  payment_status: string;
  payment_amount?: number;
  payment_type?: string;
  notes?: string;
  receipt_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewSession {
  client_id: string;
  user_id: string;
  session_number: number;
  date: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  payment_status?: string;
  payment_amount?: number;
  payment_type?: string;
  notes?: string;
  receipt_sent?: boolean;
}

export interface UpdateSession {
  session_number?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  payment_status?: string;
  payment_amount?: number;
  payment_type?: string;
  notes?: string;
  receipt_sent?: boolean;
}

/**
 * Get all sessions for the authenticated user
 */
export const getSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching sessions:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get sessions for a specific client
 */
export const getSessionsByClient = async (clientId: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching sessions by client:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get sessions for a specific date
 */
export const getSessionsByDate = async (userId: string, date: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching sessions by date:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Create a new session
 */
export const createSession = async (sessionData: NewSession) => {
  const { data, error } = await supabase
    .from('sessions')
    .insert([sessionData])
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get a specific session by ID
 */
export const getSessionById = async (id: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Update a specific session
 */
export const updateSession = async (id: string, sessionData: UpdateSession) => {
  const { data, error } = await supabase
    .from('sessions')
    .update(sessionData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating session:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Delete a specific session
 */
export const deleteSession = async (id: string) => {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting session:', error);
    throw new Error(error.message);
  }

  return true;
};