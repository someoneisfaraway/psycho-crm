// src/utils/exportData.ts
import { supabase } from '../config/supabase'; // Импортируем клиент из config
import type { Client, Session } from '../types/database'; // Импортируем типы с type-only import

// Тип для объединённых данных экспорта
interface ExportedData {
  clients: Client[];
  sessions: Session[];
  // Добавьте другие типы данных при необходимости
}

/**
 * Экспортирует данные пользователя (клиенты, сессии) в JSON файл.
 * @param userId ID пользователя, чьи данные нужно экспортировать.
 */
export const exportUserData = async (userId: string): Promise<void> => {
  try {
    console.log(`Начинаем экспорт данных для пользователя ${userId}`);

    // Получаем клиентов
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*') // Выбираем все поля
      .eq('user_id', userId); // Фильтруем по пользователю

    if (clientsError) {
      console.error('Ошибка при получении клиентов для экспорта:', clientsError);
      throw new Error(`Ошибка при получении клиентов: ${clientsError.message}`);
    }

    // Получаем сессии
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*') // Выбираем все поля
      .eq('user_id', userId); // Фильтруем по пользователю

    if (sessionsError) {
      console.error('Ошибка при получении сессий для экспорта:', sessionsError);
      throw new Error(`Ошибка при получении сессий: ${sessionsError.message}`);
    }

    // Собираем данные в один объект
    const exportData: ExportedData = {
      clients: clients || [],
      sessions: sessions || [],
    };

    // Преобразуем в строку JSON
    const jsonString = JSON.stringify(exportData, null, 2);

    // Создаём Blob
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Создаём URL для Blob
    const url = URL.createObjectURL(blob);

    // Создаём временный элемент <a> для скачивания
    const link = document.createElement('a');
    link.href = url;
    // Генерируем имя файла с временной меткой
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-'); // Формат: YYYY-MM-DDTHH-mm-ss
    link.download = `export_${userId}_${timestamp}.json`;

    // Симулируем клик по ссылке для скачивания
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Освобождаем URL Blob
    URL.revokeObjectURL(url);

    console.log('Экспорт данных завершён успешно.');
  } catch (error) {
    console.error('Ошибка при экспорте данных:', error);
    alert(`Произошла ошибка при экспорте данных: ${(error as Error).message}`);
  }
};