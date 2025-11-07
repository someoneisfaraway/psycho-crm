import { supabase } from './config/supabase';

// Функция для проверки структуры таблиц через SQL
export async function debugTableStructure() {
  const results = {
    success: false,
    clientsColumns: null as any,
    sessionsColumns: null as any,
    foreignKeys: null as any,
    error: null as string | null
  };

  try {
    console.log('🔍 Checking table structures via SQL...');
    
    // Получаем информацию о колонках таблицы clients
    const { data: clientsColumns, error: clientsColumnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'clients' });
    
    if (clientsColumnsError) {
      console.error('Error getting clients columns:', clientsColumnsError);
      results.error = clientsColumnsError.message;
      return results;
    }
    
    console.log('📋 Clients table columns:', clientsColumns);
    results.clientsColumns = clientsColumns;
    
    // Получаем информацию о колонках таблицы sessions  
    const { data: sessionsColumns, error: sessionsColumnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'sessions' });
    
    if (sessionsColumnsError) {
      console.error('Error getting sessions columns:', sessionsColumnsError);
      results.error = sessionsColumnsError.message;
      return results;
    }
    
    console.log('📋 Sessions table columns:', sessionsColumns);
    results.sessionsColumns = sessionsColumns;
    
    // Получаем информацию о foreign keys
    const { data: foreignKeys, error: foreignKeysError } = await supabase
      .rpc('get_foreign_keys', { table_name: 'sessions' });
    
    if (foreignKeysError) {
      console.error('Error getting foreign keys:', foreignKeysError);
    } else {
      console.log('🔑 Foreign keys:', foreignKeys);
      results.foreignKeys = foreignKeys;
    }
    
    // Проверяем типы данных полей id и client_id
    const clientIdColumn = clientsColumns?.find((col: any) => col.column_name === 'id');
    const sessionClientIdColumn = sessionsColumns?.find((col: any) => col.column_name === 'client_id');
    
    console.log('🎯 Column types comparison:', {
      clients_id: {
        name: clientIdColumn?.column_name,
        data_type: clientIdColumn?.data_type,
        is_nullable: clientIdColumn?.is_nullable,
        column_default: clientIdColumn?.column_default
      },
      sessions_client_id: {
        name: sessionClientIdColumn?.column_name,
        data_type: sessionClientIdColumn?.data_type,
        is_nullable: sessionClientIdColumn?.is_nullable,
        column_default: sessionClientIdColumn?.column_default
      }
    });
    
    results.success = true;
    return results;
    
  } catch (error) {
    console.error('💥 Unexpected error in debugTableStructure:', error);
    results.error = error instanceof Error ? error.message : String(error);
    return results;
  }
}

// Альтернативный метод через прямой SQL запрос
export async function debugTableStructureSQL() {
  try {
    console.log('🔍 Checking table structures via direct SQL...');
    
    // Прямой SQL запрос для получения информации о колонках
    const sql = `
      SELECT 
        table_name,
        column_name, 
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name IN ('clients', 'sessions')
      ORDER BY table_name, ordinal_position;
    `;
    
    console.log('📝 Executing SQL:', sql);
    
    // Попытка выполнить SQL через RPC (если доступно)
    const { data, error } = await supabase
      .rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return { success: false, error: error.message };
    }
    
    console.log('📊 SQL Results:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('💥 SQL execution error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}