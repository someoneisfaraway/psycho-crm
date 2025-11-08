// src/api/finances.ts
import { supabase } from '../config/supabase';

// Тип для финансовой сводки
export interface FinancialSummary {
  totalRevenue: number;
  revenueBreakdown: Record<string, number>; // e.g., { 'card': 5000, 'cash': 3000 }
  debtors: Array<{ client_id: string; client_name: string; debt_amount: number }>;
  receiptReminders: Array<{ client_id: string; client_name: string; session_date: string; session_id: string }>;
  // Дополнительные поля для карточек и раздела транзакций
  expectedRevenue?: number;
  outstandingTotal?: number;
  outstandingCount?: number;
  receiptsToSendCount?: number;
  recentTransactions?: Array<{ id: string; client_id: string; client_name: string; amount: number; date: string; payment_method?: string | null }>;
}

// Локальный тип для минимального набора полей сессии, необходимых для финансовой сводки
interface SessionSummaryRow {
  id: string;
  client_id: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed' | 'rescheduled';
  paid?: boolean;
  payment_method?: string | null;
  price: number;
  scheduled_at: string;
  receipt_sent?: boolean;
}

/**
 * Получает финансовую сводку за указанный период.
 * @param startDate - Начало периода (в формате ISO string или Date)
 * @param endDate - Конец периода (в формате ISO string или Date)
 * @param userId - ID текущего пользователя (для фильтрации)
 * @returns Promise<FinancialSummary | null> - Объект сводки или null в случае ошибки
 */
export const getFinancialSummary = async (
  startDate: string | Date,
  endDate: string | Date,
  userId: string
): Promise<FinancialSummary | null> => {
  // Конвертируем в ISO строку, если передан объект Date
  const startISO = typeof startDate === 'string' ? startDate : startDate.toISOString();
  const endISO = typeof endDate === 'string' ? endDate : endDate.toISOString();

  try {
    console.log(`Запрос финансовой сводки для пользователя ${userId} за период ${startISO} - ${endISO}`);

    // Запрос для получения всех сессий пользователя за период
    // Поля соответствуют текущей схеме: paid, payment_method, price, scheduled_at и т.д.
    const { data, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, client_id, status, paid, payment_method, price, scheduled_at, receipt_sent')
      .eq('user_id', userId)
      .gte('scheduled_at', startISO)
      .lte('scheduled_at', endISO)
      .order('scheduled_at', { ascending: true });

    if (sessionsError) {
      console.error('Ошибка при получении сессий для финансовой сводки:', sessionsError);
      throw new Error(`Ошибка при получении данных: ${sessionsError.message}`);
    }

    const sessions: SessionSummaryRow[] = (data || []) as SessionSummaryRow[];

    // Запрос для получения данных клиентов (имя, для списка должников)
    // Сначала получим уникальные ID клиентов из сессий
    const clientIds = [...new Set(sessions.map((s: SessionSummaryRow) => s.client_id))];
    let clientNames: Record<string, string> = {};
    if (clientIds.length > 0) {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);

      if (clientsError) {
        console.error('Ошибка при получении имён клиентов для финансовой сводки:', clientsError);
        // Можно не прерывать выполнение, а просто не отображать имена в должниках
        clientNames = {};
      } else {
        // Создаём маппинг ID -> Имя
        clientNames = (clients || []).reduce((acc: Record<string, string>, client: { id: string; name: string }) => {
          acc[client.id] = client.name;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // --- Логика вычисления сводки ---
    let totalRevenue = 0;
    let expectedRevenue = 0;
    let outstandingTotal = 0;
    let outstandingCount = 0;
    const revenueBreakdown: Record<string, number> = {};
    const debtorsMap: Record<string, number> = {}; // client_id -> сумма долга

    sessions.forEach((session: SessionSummaryRow) => {
      // 1. Расчёт общего дохода и разбивки
      if (session.paid) {
        const amount = session.price || 0;
        totalRevenue += amount;

        const method = session.payment_method || 'unknown';
        revenueBreakdown[method] = (revenueBreakdown[method] || 0) + amount;
      }

      // 2. Расчёт задолженности (например, сессия завершена, но не оплачена)
      if (session.status === 'completed' && !session.paid) {
         const amount = session.price || 0;
         debtorsMap[session.client_id] = (debtorsMap[session.client_id] || 0) + amount;
         outstandingTotal += amount;
         outstandingCount += 1;
      }

      // 3. Ожидаемая выручка: запланированные, ещё не оплаченные сессии
      if (session.status === 'scheduled') {
        expectedRevenue += session.price || 0;
      }
    });

    // 3. Формирование списка должников
    const debtors = Object.entries(debtorsMap).map(([client_id, debt_amount]) => ({
      client_id,
      client_name: clientNames[client_id] || 'Unknown Client',
      debt_amount,
    }));

    // 4. Формирование списка напоминаний о чеках (например, сессии оплачены, но чек не отправлен)
    const receiptReminders = sessions
      .filter((session: SessionSummaryRow) => !!session.paid && !session.receipt_sent)
      .map((session: SessionSummaryRow) => ({
        client_id: session.client_id,
        client_name: clientNames[session.client_id] || 'Unknown Client',
        session_date: session.scheduled_at,
        session_id: session.id,
      }));

    const receiptsToSendCount = receiptReminders.length;

    // 5. Недавние транзакции: последние оплаченные сессии
    const recentTransactions = sessions
      .filter((s) => !!s.paid)
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        client_id: s.client_id,
        client_name: clientNames[s.client_id] || 'Unknown Client',
        amount: s.price || 0,
        date: s.scheduled_at,
        payment_method: s.payment_method || null,
      }));

    // --- Возврат результата ---
    const summary: FinancialSummary = {
      totalRevenue,
      revenueBreakdown,
      debtors,
      receiptReminders,
      expectedRevenue,
      outstandingTotal,
      outstandingCount,
      receiptsToSendCount,
      recentTransactions,
    };

    console.log('Получена финансовая сводка:', summary);
    return summary;

  } catch (error) {
    console.error('Необработанная ошибка в getFinancialSummary:', error);
    // Более конкретная обработка ошибок может быть добавлена здесь
    return null;
  }
};