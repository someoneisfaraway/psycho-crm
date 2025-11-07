import { supabase } from '../config/supabase';

/**
 * Get sessions for a specific month
 */
export const getCalendarSessions = async (userId: string, year: number, month: number) => {
  // Format the month to ensure it's two digits
  const monthStr = month.toString().padStart(2, '0');
  
  // Create start and end dates for the month
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${new Date(year, month, 0).getDate()}`;
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching calendar sessions:', error);
    throw new Error(error.message);
  }

 return data;
};

/**
 * Get sessions for a specific date range
 */
export const getSessionsByDateRange = async (
  userId: string,
  startDate: string,
  endDate: string
) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching sessions by date range:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Get calendar data with aggregated information for UI
 */
export const getCalendarData = async (userId: string, year: number, month: number) => {
  const sessions = await getCalendarSessions(userId, year, month);
  
  // Group sessions by date for easier UI rendering
  const sessionsByDate: Record<string, typeof sessions> = {};
  
  sessions.forEach(session => {
    const date = session.date;
    if (!sessionsByDate[date]) {
      sessionsByDate[date] = [];
    }
    sessionsByDate[date].push(session);
  });
  
  return {
    sessions,
    sessionsByDate,
    month,
    year,
  };
};