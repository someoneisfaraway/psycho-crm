// src/api/clients.ts
import { supabase } from '../config/supabase';
import type { Client } from '../types/database';

// Определим интерфейс для параметров поиска и фильтрации
interface GetClientsOptions {
  userId: string;
  searchTerm?: string; // Для поиска
  statusFilter?: string; // Для фильтрации по статусу
  sourceFilters?: string[]; // Для фильтрации по источнику (массив)
  scheduleFilters?: string[]; // Для фильтрации по расписанию (массив)
  debtFilter?: 'with_debt' | 'no_debt' | 'all'; // Для фильтрации по задолженности
}

/**
 * Get all clients for the authenticated user (simple wrapper)
 */
export const getAll = async (userId: string) => {
  return getClients({ userId });
};

/**
 * Get all clients for the authenticated user with optional search and filters
 */
export const getClients = async (options: GetClientsOptions) => {
  let query = supabase
    .from('clients')
    .select('*')
    .eq('user_id', options.userId) // Всегда фильтруем по user_id
    .order('debt', { ascending: false }) // Сортировка: должники первые
    .order('last_session_at', { ascending: false }); // Потом по дате последней сессии

  // Применяем фильтр по статусу, если он задан
  if (options.statusFilter && options.statusFilter !== 'all') {
    query = query.eq('status', options.statusFilter);
  }

  // Применяем фильтр по источнику, если он задан (множественный)
  if (options.sourceFilters && options.sourceFilters.length > 0) {
    // Используем `in` для проверки, что source находится в списке фильтров
    query = query.in('source', options.sourceFilters);
  }

  // Применяем фильтр по расписанию, если он задан (множественный)
  if (options.scheduleFilters && options.scheduleFilters.length > 0) {
    query = query.in('schedule', options.scheduleFilters);
  }

  // Применяем фильтр по задолженности
  if (options.debtFilter === 'with_debt') {
    query = query.gt('debt', 0); // Больше 0
  } else if (options.debtFilter === 'no_debt') {
    query = query.eq('debt', 0); // Равно 0
  }
  // Если 'all' или не задано, фильтр не применяется

  // Применяем поиск, если задан searchTerm
  if (options.searchTerm && options.searchTerm.trim() !== '') {
    const term = `%${options.searchTerm.trim()}%`; // Подставляем термин поиска
    // Поиск по name, id, phone (и, при желании, email)
    query = query.or(`name.ilike.${term},id.ilike.${term},phone.ilike.${term},email.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error(error.message);
  }

  return data;
};

// Остальные функции остаются без изменений
// ...

/**
 * Create a new client
 */
export const createClient = async (clientData: Omit<Client, 'total_sessions' | 'total_paid' | 'debt' | 'created_at' | 'updated_at'> & { user_id: string }) => {
  // Добавим проверку, что id предоставлен или сгенерирован
  if (!clientData.id) {
    // Пример генерации ID, можно улучшить
    clientData.id = `auto_${Date.now()}`;
  }

  // Supabase строг к схемам: если в таблице нет колонки, вставка с таким ключом даст 400.
  // В некоторых инстансах таблицы 'clients' нет колонки 'meeting_link'. Уберем её из payload.
  const { meeting_link, ...rest } = clientData as any;
  // Также удалим undefined-значения, чтобы не слать лишние ключи
  const cleanedPayload = Object.fromEntries(
    Object.entries(rest).filter(([_, v]) => v !== undefined)
  );
  // Нормализуем строки: trim и пустые строки -> null
  const normalizeValue = (v: any) => typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v;
  const normalizedPayload = Object.fromEntries(
    Object.entries(cleanedPayload).map(([k, v]) => [k, normalizeValue(v)])
  );

  const { data, error } = await supabase
    .from('clients')
    .insert([normalizedPayload])
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw new Error(error.message);
  }

  return data;
};

export const updateClient = async (id: string, clientData: Partial<Omit<Client, 'id' | 'user_id'>>) => {
  // Аналогично sanitize payload: убрать meeting_link и undefined
  const { meeting_link, notes, ...rest } = clientData as any; // 'notes' не является колонкой в таблице, используем 'notes_encrypted'
  const cleanedPayload = Object.fromEntries(
    Object.entries(rest).filter(([_, v]) => v !== undefined)
  );
  // Нормализуем строки: trim и пустые строки -> null
  const normalizeValue = (v: any) => typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v;
  const normalizedPayload = Object.fromEntries(
    Object.entries(cleanedPayload).map(([k, v]) => [k, normalizeValue(v)])
  );

  const { data, error } = await supabase
    .from('clients')
    .update(normalizedPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw new Error(error.message);
  }

  return data;
}

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

// Duplicate updateClient removed; using the sanitized version defined above.

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
export type { Client };

// Export as API object for consistency with sessions API
export const clientsApi = {
  getAll,
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};
