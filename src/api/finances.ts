// src/api/finances.ts
import { createClient } from '../utils/supabaseClient';
import { Session } from '../types/database'; // Предполагаем, что тип Session определён

const supabase = createClient();

// Тип для финансовой сводки
export interface FinancialSummary {
  totalRevenue: number;
  revenueBreakdown: Record<string, number>; // e.g., { 'card': 5000, 'cash': 3000 }
  debtors: Array<{ client_id: string; client_name: string; debt_amount: number }>;
  receiptReminders: Array<{ client_id: string; client_name: string; session_date: string; session_id: string }>;
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
    // Предполагаем, что в таблице sessions есть поля: user_id, status, payment_status, payment_method, amount, client_id
    // Также предполагаем, что дата сессии хранится в поле start_time или scheduled_date
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, client_id, status, payment_status, payment_method, amount, start_time') // Уточни поля в зависимости от твоей таблицы
      .eq('user_id', userId)
      .gte('start_time', startISO) // Фильтр по дате начала
      .lte('start_time', endISO)   // Фильтр по дате окончания
      .in('status', ['completed', 'paid']); // Считаем доход только по завершённым или оплаченным сессиям

    if (sessionsError) {
      console.error('Ошибка при получении сессий для финансовой сводки:', sessionsError);
      throw new Error(`Ошибка при получении данных: ${sessionsError.message}`);
    }

    // Запрос для получения данных клиентов (имя, для списка должников)
    // Сначала получим уникальные ID клиентов из сессий
    const clientIds = [...new Set(sessions?.map(s => s.client_id) || [])];
    let clientNames: Record<string, string> = {};
    if (clientIds.length > 0) {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name') // Уточни поля в зависимости от твоей таблицы
        .in('id', clientIds);

      if (clientsError) {
        console.error('Ошибка при получении имён клиентов для финансовой сводки:', clientsError);
        // Можно не прерывать выполнение, а просто не отображать имена в должниках
        clientNames = {};
      } else {
        // Создаём маппинг ID -> Имя
        clientNames = clients.reduce((acc, client) => {
          acc[client.id] = client.name;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // --- Логика вычисления сводки ---
    let totalRevenue = 0;
    const revenueBreakdown: Record<string, number> = {};
    const debtorsMap: Record<string, number> = {}; // client_id -> сумма долга

    sessions?.forEach(session => {
      // 1. Расчёт общего дохода и разбивки
      if (session.payment_status === 'paid') { // Или status === 'completed' && session.amount?
        const amount = session.amount || 0; // Убедимся, что amount определён
        totalRevenue += amount;

        const method = session.payment_method || 'unknown'; // Уточни поле метода оплаты
        revenueBreakdown[method] = (revenueBreakdown[method] || 0) + amount;
      }

      // 2. Расчёт задолженности (например, сессия завершена, но не оплачена)
      if (session.status === 'completed' && session.payment_status !== 'paid') {
         const amount = session.amount || 0;
         debtorsMap[session.client_id] = (debtorsMap[session.client_id] || 0) + amount;
      }
    });

    // 3. Формирование списка должников
    const debtors = Object.entries(debtorsMap).map(([client_id, debt_amount]) => ({
      client_id,
      client_name: clientNames[client_id] || 'Unknown Client', // Используем имя из маппинга
      debt_amount,
    }));

    // 4. Формирование списка напоминаний о чеках (например, сессии оплачены, но чек не отправлен)
    // Предположим, есть поле receipt_sent (boolean) в таблице sessions
    const receiptReminders = sessions
      ?.filter(session => session.payment_status === 'paid' && !session.receipt_sent) // Чек не отправлен
      .map(session => ({
        client_id: session.client_id,
        client_name: clientNames[session.client_id] || 'Unknown Client',
        session_date: session.start_time,
        session_id: session.id,
      })) || [];

    // --- Возврат результата ---
    const summary: FinancialSummary = {
      totalRevenue,
      revenueBreakdown,
      debtors,
      receiptReminders,
    };

    console.log('Получена финансовая сводка:', summary);
    return summary;

  } catch (error) {
    console.error('Необработанная ошибка в getFinancialSummary:', error);
    // Более конкретная обработка ошибок может быть добавлена здесь
    return null;
  }
};