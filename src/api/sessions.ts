// src/api/sessions.ts
import { supabase } from '../config/supabase';
import type { Session } from '../types/database';
import { sendPushToUser } from './notifications';

// РўРёРї РґР»СЏ СЃРѕР·РґР°РЅРёСЏ СЃРµСЃСЃРёРё
interface CreateSessionDto {
  user_id: string;
  client_id: string;
  // session_number Р±СѓРґРµС‚ СЃРіРµРЅРµСЂРёСЂРѕРІР°РЅ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё
  scheduled_at: string; // ISO string
  completed_at?: string; // ISO string
  duration?: number; // DEFAULT 50
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed' | 'rescheduled'; // required field
  price: number;
  paid?: boolean; // DEFAULT FALSE
  paid_at?: string; // ISO string
  payment_method?: string; // 'card', 'cash', 'platform', 'transfer'
  receipt_sent?: boolean; // DEFAULT FALSE
  receipt_sent_at?: string; // ISO string
  receipt_reminder?: boolean; // DEFAULT FALSE
  format: 'online' | 'offline'; // 'online', 'offline'
  meeting_link?: string;
  note_encrypted?: string;
}

// РўРёРї РґР»СЏ РѕР±РЅРѕРІР»РµРЅРёСЏ СЃРµСЃСЃРёРё
interface UpdateSessionDto {
  // ... РІСЃРµ РїРѕР»СЏ, РєРѕС‚РѕСЂС‹Рµ РјРѕР¶РЅРѕ РѕР±РЅРѕРІРёС‚СЊ
  status?: string;
  paid?: boolean;
  paid_at?: string;
  payment_method?: string;
  receipt_sent?: boolean;
  receipt_sent_at?: string;
  receipt_reminder?: boolean;
  scheduled_at?: string;
  completed_at?: string;
  format?: string;
  meeting_link?: string;
  note_encrypted?: string;
  // session_number, user_id, client_id РѕР±С‹С‡РЅРѕ РЅРµ РјРµРЅСЏСЋС‚СЃСЏ
}

export const sessionsApi = {
  // РџРѕР»СѓС‡РёС‚СЊ СЃРµСЃСЃРёРё РІ РґРёР°РїР°Р·РѕРЅРµ РґР°С‚
  async getForDateRange(userId: string, startDate: Date, endDate: Date) {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        clients(id, name)
      `)
      .eq('user_id', userId)
      .gte('scheduled_at', startISO)
      .lte('scheduled_at', endISO)
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching sessions for date range:', error);
      throw error;
    }

    // console.log('Fetched sessions for date range:', data); // Р”Р»СЏ РѕС‚Р»Р°РґРєРё
    return data || [];
  },

  // РџРѕР»СѓС‡РёС‚СЊ СЃРµСЃСЃРёРё РґР»СЏ РєРѕРЅРєСЂРµС‚РЅРѕР№ РґР°С‚С‹ (СЃРј. РўР— 5.3)
  async getForDate(userId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        clients(id, name)
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

  // РџРѕР»СѓС‡РёС‚СЊ СЃРµСЃСЃРёРё РґР»СЏ РєРѕРЅРєСЂРµС‚РЅРѕРіРѕ РєР»РёРµРЅС‚Р°
  async getSessionsByClient(clientId: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions by client:', error);
      throw error;
    }

    return data || [];
  },

  // РЎРѕР·РґР°С‚СЊ СЃРµСЃСЃРёСЋ (СЃРј. РўР— 5.3)
  async create(sessionData: Omit<CreateSessionDto, 'session_number'>) {
    console.log('=== SESSION CREATE DEBUG ===');
    console.log('Input sessionData:', sessionData);
    
    // РџСЂРѕРІРµСЂРєР° РЅР°Р»РёС‡РёСЏ user_id
    if (!sessionData.user_id) {
      throw new Error('user_id is required to create a session');
    }

    // РџСЂРѕРІРµСЂРєР° RLS - РїРѕР»СѓС‡РёРј С‚РµРєСѓС‰РµРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('Authentication error: ' + authError.message);
    }
    
    console.log('Current authenticated user:', user);
    console.log('Session user_id:', sessionData.user_id);
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    if (user.id !== sessionData.user_id) {
      console.error('User ID mismatch:', {
        session_user_id: sessionData.user_id,
        auth_user_id: user.id
      });
      throw new Error('User ID mismatch');
    }

    // Ensure user row exists to satisfy sessions_user_id_fkey
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .limit(1);

      const userExists = Array.isArray(existingUser) ? existingUser.length > 0 : !!existingUser;

      if (!userExists) {
        console.log('User row not found in users table. Attempting RPC ensure_user_exists...');
        const { error: rpcError } = await supabase.rpc('ensure_user_exists', {
          uid: user.id,
          uemail: user.email || null
        });

        if (rpcError) {
          console.warn('RPC ensure_user_exists failed or missing:', rpcError);
        }

        // Re-check after RPC attempt
        const { data: recheck } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .limit(1);

        const existsAfterRpc = Array.isArray(recheck) ? recheck.length > 0 : !!recheck;
        if (!existsAfterRpc) {
          throw new Error('User row missing in public.users. Please run backfill SQL to sync auth.users в†’ public.users');
        }
        console.log('User ensured via RPC');
      }
    } catch (ensureUserError) {
      console.error('Error ensuring user row:', ensureUserError);
      throw ensureUserError instanceof Error ? ensureUserError : new Error(String(ensureUserError));
    }

    // Check if client exists and belongs to user
    console.log('Validating client:', {
      client_id: sessionData.client_id,
      user_id: user.id,
      client_id_type: typeof sessionData.client_id,
      client_id_value: sessionData.client_id
    });
    
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', sessionData.client_id)
      .eq('user_id', user.id)
      .single();
    
    if (clientError || !client) {
      console.error('Client validation error:', clientError);
      console.error('Client validation result:', { client, clientError });
      throw new Error('Client not found or does not belong to user');
    }
    
    console.log('Client validation successful:', client);

    // Prepare data for insertion - remove undefined values
    const insertData = {
      user_id: sessionData.user_id,
      client_id: sessionData.client_id,
      scheduled_at: sessionData.scheduled_at,
      format: sessionData.format,
      price: sessionData.price,
      duration: sessionData.duration,
      status: sessionData.status,
      paid: sessionData.paid ?? false,
      receipt_sent: sessionData.receipt_sent ?? false,
      receipt_reminder: sessionData.receipt_reminder ?? false,
      note_encrypted: sessionData.note_encrypted,
      meeting_link: sessionData.meeting_link,
      // session_number РїСЂРёСЃРІР°РёРІР°РµС‚СЃСЏ РЅР° СЃРµСЂРІРµСЂРµ С‚СЂРёРіРіРµСЂРѕРј
    };
    
    // Remove undefined values to prevent NOT NULL constraint errors
    Object.keys(insertData).forEach(key => {
      if (insertData[key as keyof typeof insertData] === undefined) {
        delete insertData[key as keyof typeof insertData];
      }
    });
    
    console.log('Prepared insert data:', insertData);
    
    try {
      const { data: createdSession, error: insertError } = await supabase
        .from('sessions')
        .insert([insertData])
        .select(`
          *,
          clients(id, name)
        `)
        .single();
      
      if (insertError) {
        console.error('Database insertion error:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        
        // More specific error handling
        if (insertError.code === '42501') {
          throw new Error('Permission denied - check Row Level Security policies');
        } else if (insertError.code === '23505') {
          throw new Error('Session with this number already exists');
        } else if (insertError.code === '23503') {
          throw new Error('Referenced client not found');
        } else if (insertError.code === '23502') {
          throw new Error(`Missing required field: ${insertError.message}`);
        }
        
        throw new Error(`Failed to create session: ${insertError.message}`);
      }
      
      if (!createdSession) {
        console.error('No session returned from database');
        throw new Error('Session creation failed - no data returned');
      }
      
      console.log('Session created successfully:', createdSession);

      try {
        const when = new Date(createdSession.scheduled_at);
        const formatRuDateTime = (d: Date) => {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          return `${dd}.${mm}.${yyyy}. ${hh}:${min}`;
        };
        const immediateClientName = (createdSession.clients && (createdSession as any).clients?.name) ? (createdSession as any).clients.name : '';
        const immediateHeading = immediateClientName ? `Сессия с ${immediateClientName}` : 'Сессия';
        const immediateBody = formatRuDateTime(when);
        await sendPushToUser(user.id, immediateHeading, immediateBody);
        const reminderAt = new Date(when.getTime() - 60 * 60 * 1000);
        if (reminderAt.getTime() > Date.now()) {
          const clientName = (createdSession.clients && (createdSession as any).clients?.name) ? (createdSession as any).clients.name : '';
          const heading = clientName ? `Сессия с ${clientName}` : 'Сессия';
          const body = formatRuDateTime(when);
          await sendPushToUser(user.id, heading, body, undefined, reminderAt.toISOString());
        }
      } catch {}
      
      // Update client's next_session_at field
      if (createdSession.client_id && createdSession.scheduled_at) {
        const { error: updateError } = await supabase
          .from('clients')
          .update({ next_session_at: createdSession.scheduled_at })
          .eq('id', createdSession.client_id)
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Failed to update client next_session_at:', updateError);
          // Don't throw here as the session was created successfully
        }
      }
      
      return createdSession;
      
    } catch (error) {
      console.error('Session creation failed:', error);
      throw error;
    }
  },

  // РћР±РЅРѕРІРёС‚СЊ СЃРµСЃСЃРёСЋ
  async update(id: string, updates: Partial<UpdateSessionDto>) {
    const { data: before } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        clients(id, name)
      `)
      .single();

    if (error) {
      console.error(`Error updating session with id ${id}:`, error);
      throw error;
    }

    try {
      const oldAt = before ? new Date((before as any).scheduled_at) : null;
      const newAt = data ? new Date((data as any).scheduled_at) : null;
      if (updates.scheduled_at && oldAt && newAt && oldAt.getTime() !== newAt.getTime()) {
        const immediateClientName = (data && (data as any).clients?.name) ? (data as any).clients.name : '';
        const formatRuDateTime = (d: Date) => {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          return `${dd}.${mm}.${yyyy}. ${hh}:${min}`;
        };
        const immediateHeading = immediateClientName ? `Сессия с ${immediateClientName}` : 'Сессия';
        const immediateBody = formatRuDateTime(newAt);
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          await sendPushToUser(user.id, immediateHeading, immediateBody);
          const reminderAt = new Date(newAt.getTime() - 60 * 60 * 1000);
          if (reminderAt.getTime() > Date.now()) {
            const formatRuDateTime = (d: Date) => {
              const dd = String(d.getDate()).padStart(2, '0');
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const yyyy = d.getFullYear();
              const hh = String(d.getHours()).padStart(2, '0');
              const min = String(d.getMinutes()).padStart(2, '0');
              return `${dd}.${mm}.${yyyy}. ${hh}:${min}`;
            };
            const clientName = (data && (data as any).clients?.name) ? (data as any).clients.name : '';
            const heading = clientName ? `Сессия с ${clientName}` : 'Сессия';
            const body = formatRuDateTime(newAt);
            await sendPushToUser(user.id, heading, body, undefined, reminderAt.toISOString());
          }
        }
      }
    } catch {}

    return data;
  },

  // РћС‚РјРµС‚РёС‚СЊ СЃРµСЃСЃРёСЋ Р·Р°РІРµСЂС€С‘РЅРЅРѕР№
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
        clients(id, name)
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
        clients(id, name)
      `)
      .single();

    if (error) {
      console.error('Error marking session as paid:', error);
      throw error;
    }

    return data;
  },

  // РћС‚РјРµС‚РёС‚СЊ СЃРµСЃСЃРёСЋ РѕРїР»Р°С‡РµРЅРЅРѕР№
  // Снять отметку об оплате
  async unmarkPaid(id: string) {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        paid: false,
        paid_at: null,
        payment_method: null
      })
      .eq('id', id)
      .select(`
        *,
        clients(id, name)
      `)
      .single();

    if (error) {
      console.error('Error unmarking session as paid:', error);
      throw error;
    }

    return data;
  },

  // РћС‚РјРµС‚РёС‚СЊ С‡РµРє РѕС‚РїСЂР°РІР»РµРЅРЅС‹Рј
  // Снять отметку об отправке чека
  async unmarkReceiptSent(id: string) {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        receipt_sent: false,
        receipt_sent_at: null
      })
      .eq('id', id)
      .select(`
        *,
        clients(id, name)
      `)
      .single();

    if (error) {
      console.error('Error unmarking receipt as sent:', error);
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
        clients(id, name)
      `)
      .single();

    if (error) {
      console.error('Error marking receipt as sent:', error);
      throw error;
    }

    return data;
  },

  // РћС‚РјРµС‚РёС‚СЊ СЃРµСЃСЃРёСЋ РѕС‚РјРµРЅС‘РЅРЅРѕР№
  async markCancelled(id: string) {
    const { data, error } = await supabase
      .from('sessions')
      .update({
        status: 'cancelled'
        // РњРѕР¶РЅРѕ РґРѕР±Р°РІРёС‚СЊ cancelled_at, РµСЃР»Рё РЅСѓР¶РЅРѕ
        // cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        clients(id, name)
      `)
      .single();

    if (error) {
      console.error('Error marking session as cancelled:', error);
      throw error;
    }

    return data;
  },

  // РЈРґР°Р»РёС‚СЊ СЃРµСЃСЃРёСЋ
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

// Р­РєСЃРїРѕСЂС‚РёСЂСѓРµРј С„СѓРЅРєС†РёСЋ РѕС‚РґРµР»СЊРЅРѕ РґР»СЏ РѕР±СЂР°С‚РЅРѕР№ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё
export const getSessionsByClient = sessionsApi.getSessionsByClient;
