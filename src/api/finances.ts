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

    // Запрос для получения данных клиентов (имя, тип оплаты, необходимость чека)
    // Сначала получим уникальные ID клиентов из сессий
    const clientIds = [...new Set(sessions.map((s: SessionSummaryRow) => s.client_id))];
    let clientDetails: Record<string, { name: string; payment_type?: string; need_receipt?: boolean }> = {};
    
    if (clientIds.length > 0) {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, payment_type, need_receipt')
        .in('id', clientIds);

      if (clientsError) {
        console.error('Ошибка при получении данных клиентов для финансовой сводки:', clientsError);
        clientDetails = {};
      } else {
        // Создаём маппинг ID -> Детали клиента
        clientDetails = (clients || []).reduce((acc: Record<string, { name: string; payment_type?: string; need_receipt?: boolean }>, client: any) => {
          acc[client.id] = {
            name: client.name,
            payment_type: client.payment_type,
            need_receipt: client.need_receipt
          };
          return acc;
        }, {});
      }
    }

    let totalRevenue = 0;
    let expectedRevenue = 0;
    let outstandingTotal = 0;
    let outstandingCount = 0;
    const revenueBreakdown: Record<string, number> = {};
    const debtorsMap: Record<string, number> = {};

    sessions.forEach((session: SessionSummaryRow) => {
      // 1. Расчёт общего дохода и разбивки
      if (session.paid) {
        const amount = session.price || 0;
        totalRevenue += amount;

        const method = session.payment_method || 'unknown';
        revenueBreakdown[method] = (revenueBreakdown[method] || 0) + amount;
      }

      // 3. Ожидаемая выручка: запланированные и НЕоплаченные сессии
      if (session.status === 'scheduled' && !session.paid) {
        expectedRevenue += session.price || 0;
      }
    });

    const { data: allDebtsData, error: allDebtsError } = await supabase
      .from('sessions')
      .select('id, client_id, price, scheduled_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .eq('paid', false)
      .order('scheduled_at', { ascending: false });

    if (allDebtsError) {
      throw new Error(`Ошибка при получении задолженностей: ${allDebtsError.message}`);
    }

    const allDebtsSessions: SessionSummaryRow[] = (allDebtsData || []) as SessionSummaryRow[];

    const { data: allReceiptsData, error: allReceiptsError } = await supabase
      .from('sessions')
      .select('id, client_id, price, scheduled_at, receipt_sent')
      .eq('user_id', userId)
      .eq('paid', true)
      .eq('receipt_sent', false)
      .order('scheduled_at', { ascending: false });

    if (allReceiptsError) {
      throw new Error(`Ошибка при получении чеков: ${allReceiptsError.message}`);
    }

    const allReceiptsSessions: SessionSummaryRow[] = (allReceiptsData || []) as SessionSummaryRow[];

    const requiredClientIds = Array.from(
      new Set([
        ...Object.keys(clientDetails),
        ...allDebtsSessions.map((s) => s.client_id),
        ...allReceiptsSessions.map((s) => s.client_id),
      ])
    );
    const missingIds = requiredClientIds.filter((id) => !clientDetails[id]);
    if (missingIds.length > 0) {
      const { data: moreClients } = await supabase
        .from('clients')
        .select('id, name, payment_type, need_receipt')
        .in('id', missingIds);
      if (moreClients) {
        moreClients.forEach((c: any) => {
          clientDetails[c.id] = {
            name: c.name,
            payment_type: c.payment_type,
            need_receipt: c.need_receipt
          };
        });
      }
    }

    outstandingTotal = allDebtsSessions.reduce((sum, s) => sum + (s.price || 0), 0);
    outstandingCount = allDebtsSessions.length;

    allDebtsSessions.forEach((s) => {
      const amount = s.price || 0;
      debtorsMap[s.client_id] = (debtorsMap[s.client_id] || 0) + amount;
    });

    const debtors = Object.entries(debtorsMap)
      .map(([client_id, debt_amount]) => ({
        client_id,
        client_name: clientDetails[client_id]?.name || 'Unknown Client',
        debt_amount,
      }))
      .sort((a, b) => (b.debt_amount || 0) - (a.debt_amount || 0));

    // Filter receipts: exclude if payment_type is 'cash' (Cash (no receipts)) or need_receipt is false
    const filteredReceiptSessions = allReceiptsSessions.filter(session => {
      const client = clientDetails[session.client_id];
      if (!client) return true; // Keep if client unknown
      const isCash = client.payment_type === 'cash';
      const receiptsDisabled = client.need_receipt === false;
      return !isCash && !receiptsDisabled;
    });

    const receiptReminders = filteredReceiptSessions.map((session: SessionSummaryRow) => ({
      client_id: session.client_id,
      client_name: clientDetails[session.client_id]?.name || 'Unknown Client',
      session_date: session.scheduled_at,
      session_id: session.id,
    }));

    const receiptsToSendCount = filteredReceiptSessions.length;

    // 5. Недавние транзакции: последние оплаченные сессии
    const recentTransactions = sessions
      .filter((s) => !!s.paid)
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        client_id: s.client_id,
        client_name: clientDetails[s.client_id]?.name || 'Unknown Client',
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

/**
 * Получить список транзакций (оплаченных сессий) за период для экспорта.
 * Возвращает массив объектов с полями: дата, клиент, сумма, тип оплаты, чек отправлен.
 */
export const getTransactionsForPeriod = async (
  startDate: string | Date,
  endDate: string | Date,
  userId: string
): Promise<Array<{ date: string; client_name: string; client_display_id?: string; client_source?: string; amount: number; payment_method: string | null; receipt_sent: boolean }>> => {
  const startISO = typeof startDate === 'string' ? new Date(startDate).toISOString() : startDate.toISOString();
  const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
  endDateObj.setHours(23, 59, 59, 999);
  const endISO = endDateObj.toISOString();

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, client_id, paid, payment_method, price, scheduled_at, receipt_sent')
      .eq('user_id', userId)
      .gte('scheduled_at', startISO)
      .lte('scheduled_at', endISO)
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Ошибка при получении транзакций для периода:', error);
      return [];
    }

    const sessions: SessionSummaryRow[] = (data || []) as SessionSummaryRow[];

    const clientIds = [...new Set(sessions.map((s) => s.client_id))];
    let clientData: Record<string, { name: string; display_id?: string; source?: string }> = {};
    if (clientIds.length > 0) {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, display_id, source')
        .in('id', clientIds);
      if (!clientsError && clients) {
        clientData = clients.reduce((acc: Record<string, { name: string; display_id?: string; source?: string }>, client: { id: string; name: string; display_id?: string; source?: string }) => {
          acc[client.id] = { 
            name: client.name,
            display_id: client.display_id,
            source: client.source
          };
          return acc;
        }, {});
      }
    }

    const transactions = sessions
      .filter((s) => !!s.paid)
      .map((s) => ({
        date: s.scheduled_at,
        client_name: clientData[s.client_id]?.name || 'Unknown Client',
        client_display_id: clientData[s.client_id]?.display_id,
        client_source: clientData[s.client_id]?.source,
        amount: s.price || 0,
        payment_method: s.payment_method || null,
        receipt_sent: !!s.receipt_sent,
      }));

    return transactions;
  } catch (e) {
    console.error('Необработанная ошибка при экспорте транзакций:', e);
    return [];
  }
};
