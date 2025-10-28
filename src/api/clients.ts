import { supabase } from '../config/supabase';
import type { Client, NewClient, UpdateClient } from '../types/database';

/**
 * Get all clients for the authenticated user
 */
export const getClients = async (userId: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Create a new client
 */
export const createClient = async (clientData: NewClient) => {
  const { data, error } = await supabase
    .from('clients')
    .insert([clientData])
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get a specific client by ID
 */
export const getClientById = async (id: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Update a specific client
 */
export const updateClient = async (id: string, clientData: UpdateClient) => {
  const { data, error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Delete a specific client
 */
export const deleteClient = async (id: string) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting client:', error);
    throw new Error(error.message);
  }

  return true;
};

// Export types
export type { Client, NewClient, UpdateClient };