// src/api/sessions.ts
import { supabase } from '../config/supabase';
import type { Session, CreateSessionDto, UpdateSessionDto } from '../types/database';

// Опционально: тип для создания сессии
// interface CreateSessionDto {
//   user_id: string;
//   client_id: string;
//   // session_number будет сгенерирован автоматически
//   scheduled_at: string; // ISO string
//   completed_at?: string; // ISO string
//   duration?: number;
//   status?: string; // 'scheduled', 'completed', 'cancelled', 'missed', 'rescheduled'
//   price: number;
//   paid?: boolean;
//   paid_at?: string; // ISO string
//   payment_method?: string; // 'card', 'cash', 'platform', 'transfer'
//   receipt_sent?: boolean;
//   receipt_sent_at?: string; // ISO string
//   receipt_reminder?: boolean;
//   format: string; // 'online', 'offline'
//   meeting_link?: string;
//   note_encrypted?: string;
// }

// Опционально: тип для обновления сессии
// interface UpdateSessionDto {
//   // ... все поля, которые можно обновить
//   status?: string;
//   paid?: boolean;
//   paid_at?: string;
//   payment_method?: string;
//   receipt_sent?: boolean;
//   receipt_sent_at?: string;
//   receipt_reminder?: boolean;
//   scheduled_at?: string;
//   completed_at?: string;
//   format?: string;
//   meeting_link?: string;
//   note_encrypted?: string;
//   // session_number, user_id, client_id обычно не меняются
// }

export const sessionsApi = {
  // Получить сессии в диапазоне дат
  async getForDateRange(userId: string, startDate: Date, endDate: Date) {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        clients(id, name) -- Загружаем имя клиента
      `)
      .eq('user_id', userId)
      .gte('scheduled_at', startISO)
      .lte('scheduled_at', endISO)
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching sessions for date range:', error);
      throw error;
    }

    // console.log('Fetched sessions for date range:', data); // Для отладки
    return data || [];
  },

  // Получить сессии для конкретной даты (см. ТЗ 5.3)
  async getForDate(userId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        clients(id, name) -- Загружаем имя клиента
      `)
      .eq('user_id', userId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching sessions for date:', error);
      throw error;
    }

    return data || [];
  },

  // Создать сессию (см. ТЗ 5.3)
  async create(sessionData: Omit<CreateSessionDto, 'session_number'>) {
    // Получить следующий номер сессии у клиента (см. ТЗ 4.5)
    const { data: sessionNumberData, error: rpcError } = await supabase
      .rpc('get_next_session_number', { p_client_id: sessionData.client_id });

    if (rpcError) {
      console.error('Error getting next session number:', rpcError);
      throw rpcError;
    }

    const sessionNumber = sessionNumberData;

    const { data, error } = await supabase
      .from('sessions')
      .insert([{ ...sessionData, session_number: sessionNumber }])
      .select(`
        *,
        clients(id, name) -- Загружаем имя клиента
      `)
      .single();

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }

    // Обновить next_session_at у клиента (см. ТЗ 4.2)
    await supabase
      .from('clients')
      .update({ next_session_at: sessionData.scheduled_at })
      .eq('id', sessionData.client_id);

    return data;
  },

  // Обновить сессию
  async update(id: string, updates: Partial<UpdateSessionDto>) {
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        clients(id, name) -- Загружаем имя клиента
      `)
      .single();

    if (error) {
      console.error(`Error updating session with id ${id}:`, error);
      throw error;
    }

    return data;
  },

  // Отметить сессию завершённой
  async markCompleted(id: string) {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        clients(id, name) -- Загружаем имя клиента
      `)
      .single();

    if (error) {
      console.error('Error marking session as completed:', error);
      throw error;
    }

    return data;
  },

  // Отметить сессию оплаченной
  async markPaid(id: string, paymentMethod: string) {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        paid: true,
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod
      })
      .eq('id', id)
      .select(`
        *,
        clients(id, name) -- Загружаем имя клиента
      `)
      .single();

    if (error) {
      console.error('Error marking session as paid:', error);
      throw error;
    }

    return data;
  },

  // Отметить чек отправленным
  async markReceiptSent(id: string) {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        receipt_sent: true,
        receipt_sent_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        clients(id, name) -- Загружаем имя клиента
      `)
      .single();

    if (error) {
      console.error('Error marking receipt as sent:', error);
      throw error;
    }

    return data;
  },

  // Отметить сессию отменённой
  async markCancelled(id: string) {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        status: 'cancelled'
        // Можно добавить cancelled_at, если нужно
        // cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        clients(id, name) -- Загружаем имя клиента
      `)
      .single();

    if (error) {
      console.error('Error marking session as cancelled:', error);
      throw error;
    }

    return data;
  },

  // Удалить сессию
  async delete(id: string) {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting session:', error);
      throw error;
    }

    return true;
  }
};

// Export types
export type { Session, CreateSessionDto, UpdateSessionDto };