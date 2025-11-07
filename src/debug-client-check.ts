import { supabase } from './config/supabase';

// Функция для проверки клиента и структуры таблицы
export async function debugClientCheck() {
  const results = {
    success: false,
    auth: { success: false, userId: null, error: null },
    clients: { found: 0, firstClient: null, error: null },
    sessions: { found: 0, firstSession: null, error: null },
    foreignKeyTest: { success: false, testClientId: null, error: null },
    overallError: null
  };

  try {
    console.log('🚀 Starting client check debug...');
    
    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      results.auth.error = authError?.message || 'No user found';
      return results;
    }
    
    console.log('✅ User authenticated:', user.id);
    results.auth.success = true;
    results.auth.userId = user.id;
    
    // Проверяем структуру таблицы clients
    console.log('📋 Checking clients table structure...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);
    
    if (clientsError) {
      console.error('❌ Error fetching clients:', clientsError);
      results.clients.error = clientsError.message;
    } else {
      console.log('✅ Clients found:', clients?.length || 0);
      results.clients.found = clients?.length || 0;
      
      if (clients && clients.length > 0) {
        const firstClient = {
          id: clients[0].id,
          id_type: typeof clients[0].id,
          user_id: clients[0].user_id,
          name: clients[0].name
        };
        console.log('📊 First client structure:', firstClient);
        results.clients.firstClient = firstClient;
      }
    }
    
    // Проверяем структуру таблицы sessions
    console.log('📋 Checking sessions table structure...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      results.sessions.error = sessionsError.message;
    } else {
      console.log('✅ Sessions found:', sessions?.length || 0);
      results.sessions.found = sessions?.length || 0;
      
      if (sessions && sessions.length > 0) {
        const firstSession = {
          id: sessions[0].id,
          client_id: sessions[0].client_id,
          client_id_type: typeof sessions[0].client_id
        };
        console.log('📊 First session structure:', firstSession);
        results.sessions.firstSession = firstSession;
      }
    }
    
    // Проверяем foreign key constraint
    console.log('🔍 Testing foreign key relationship...');
    if (clients && clients.length > 0) {
      const testClientId = clients[0].id;
      console.log('🧪 Testing with client ID:', testClientId);
      results.foreignKeyTest.testClientId = testClientId;
      
      // Проверяем, существует ли клиент с этим ID для данного пользователя
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', testClientId)
        .eq('user_id', user.id)
        .single();
      
      if (checkError) {
        console.error('❌ Client check error:', checkError);
        results.foreignKeyTest.error = checkError.message;
      } else {
        console.log('✅ Client exists:', existingClient);
        results.foreignKeyTest.success = true;
      }
    }
    
    results.success = true;
    console.log('✅ Debug client check completed', results);
    return results;
    
  } catch (error) {
    console.error('💥 Unexpected error in debugClientCheck:', error);
    results.overallError = error instanceof Error ? error.message : String(error);
    return results;
  }
}

// Запускаем отладку
if (typeof window !== 'undefined') {
  console.log('🎯 Debug client check available. Call debugClientCheck() to run.');
  (window as any).debugClientCheck = debugClientCheck;
}