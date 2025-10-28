import { supabase } from '../config/supabase';

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
  status: string;
  created_at: string;
}

export interface NewNotification {
  user_id: string;
 client_id?: string;
  session_id?: string;
  type: string;
  title: string;
  message: string;
  scheduled_at: string;
}

export interface UpdateNotification {
  title?: string;
  message?: string;
  scheduled_at?: string;
  sent_at?: string;
  status?: string;
}

/**
 * Get all notifications for the authenticated user
 */
export const getNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get notifications by status
 */
export const getNotificationsByStatus = async (userId: string, status: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('status', status)
    .order('scheduled_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications by status:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Create a new notification
 */
export const createNotification = async (notificationData: NewNotification) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([notificationData])
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get a specific notification by ID
 */
export const getNotificationById = async (id: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching notification:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Update a specific notification
 */
export const updateNotification = async (id: string, notificationData: UpdateNotification) => {
 const { data, error } = await supabase
    .from('notifications')
    .update(notificationData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating notification:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Delete a specific notification
 */
export const deleteNotification = async (id: string) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting notification:', error);
    throw new Error(error.message);
  }

  return true;
};