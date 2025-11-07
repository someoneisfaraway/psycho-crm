// Debug session creation issues
import { supabase } from './config/supabase';

export async function debugSessionCreation() {
  console.log('🧪 Starting debug session creation...');
  
  try {
    // Проверка аутентификации
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error(`Authentication failed: ${authError?.message || 'No user found'}`);
    }
    console.log('✅ Authentication successful, user:', user.id);
    
    // Проверка наличия клиентов
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, user_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);
    
    if (clientsError) {
      throw new Error(`Clients check failed: ${clientsError.message}`);
    }
    
    if (!clients || clients.length === 0) {
      throw new Error('No active clients found for this user. Please create a client first.');
    }
    
    console.log('✅ Found active client:', clients[0].id);
    
    // Подготовка тестовых данных (номер сессии назначается на сервере)
    const testSession = {
      user_id: user.id,
      client_id: clients[0].id,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // завтра
      duration: 50,
      status: 'scheduled',
      price: 1000,
      paid: false,
      receipt_sent: false,
      receipt_reminder: false,
      format: 'online',
      meeting_link: 'https://zoom.us/test',
      note_encrypted: null,
      // session_number будет назначен триггером в БД
    };
    
    console.log('📝 Test session data:', testSession);
    
    // Попытка создания сессии
    console.log('🚀 Attempting to create session...');
    const { data: session, error: createError } = await supabase
      .from('sessions')
      .insert([testSession])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Full error details:', createError);
      throw new Error(`Session creation failed: ${createError.message}. Code: ${createError.code}, Details: ${JSON.stringify(createError.details)}`);
    }
    
    console.log('✅ Session created successfully:', session);
    
    // Удаляем тестовую сессию
    console.log('🧹 Cleaning up test session...');
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', session.id);
    
    if (deleteError) {
      console.warn('⚠️ Failed to delete test session:', deleteError.message);
    } else {
      console.log('✅ Test session cleaned up');
    }
    
    return { success: true, message: 'Debug session creation test completed successfully!' };
    
  } catch (error) {
    console.error('❌ Debug session creation failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Check actual table structure
export async function checkTableStructure() {
  console.log('=== CHECKING TABLE STRUCTURE ===');
  
  try {
    // This is a workaround to check table structure
    // We'll try to query with specific fields to see which ones exist
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: 'No authenticated user' };
    }
    
    // Try different field combinations
    const fieldTests = [
      ['id', 'user_id', 'client_id'],
      ['id', 'user_id', 'client_id', 'scheduled_at'],
      ['id', 'user_id', 'client_id', 'scheduled_at', 'format'],
      ['id', 'user_id', 'client_id', 'scheduled_at', 'format', 'price'],
      ['id', 'user_id', 'client_id', 'scheduled_at', 'format', 'price', 'status'],
      ['id', 'user_id', 'client_id', 'scheduled_at', 'format', 'price', 'status', 'session_number'],
      ['*'] // All fields
    ];
    
    const results = [];
    
    for (const fields of fieldTests) {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select(fields.join(', '))
          .eq('user_id', user.id)
          .limit(1);
        
        results.push({
          fields: fields.join(', '),
          success: !error,
          error: error?.message,
          errorCode: error?.code,
          dataFound: data?.length || 0
        });
        
        if (data && data.length > 0) {
          console.log('Available fields in sessions table:', Object.keys(data[0]));
        }
        
      } catch (testError) {
        results.push({
          fields: fields.join(', '),
          success: false,
          error: (testError as Error).message
        });
      }
    }
    
    return { results };
    
  } catch (error) {
    return { error: (error as Error).message };
  }
}