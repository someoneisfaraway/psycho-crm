import { supabase } from './config/supabase';

// Простая проверка типов данных
export async function debugSimpleCheck() {
  try {
    console.log('🔍 Starting simple debug check...');
    
    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return { success: false, error: 'Not authenticated' };
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // Убедимся, что запись пользователя существует в таблице users (для внешнего ключа sessions.user_id)
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .limit(1);
      const userExists = Array.isArray(existingUser) ? existingUser.length > 0 : !!existingUser;
      
      if (!userExists) {
        console.log('ℹ️ User row not found in users. Trying RPC ensure_user_exists...');
        const { error: rpcError } = await supabase.rpc('ensure_user_exists', {
          uid: user.id,
          uemail: user.email || null
        });
        if (rpcError) {
          console.warn('⚠️ RPC ensure_user_exists failed or missing:', rpcError);
        }
        const { data: recheck } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .limit(1);
        const existsAfterRpc = Array.isArray(recheck) ? recheck.length > 0 : !!recheck;
        if (!existsAfterRpc) {
          return { success: false, error: 'User row missing in public.users. Please run backfill SQL to sync auth.users → public.users' };
        }
        console.log('✅ User ensured via RPC');
      }
    } catch (ensureUserError) {
      console.error('💥 Error ensuring user row:', ensureUserError);
      return { success: false, error: ensureUserError instanceof Error ? ensureUserError.message : String(ensureUserError) };
    }
    
    // Получаем первого клиента
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientsError) {
      console.error('❌ Error fetching clients:', clientsError);
      return { success: false, error: clientsError.message };
    }
    
    if (!clients || clients.length === 0) {
      console.error('❌ No clients found');
      return { success: false, error: 'No clients found' };
    }
    
    const firstClient = clients[0];
    console.log('📊 First client:', {
      id: firstClient.id,
      id_type: typeof firstClient.id,
      id_constructor: firstClient.id?.constructor?.name,
      user_id: firstClient.user_id,
      name: firstClient.name
    });
    
    // Пробуем создать тестовую сессию с этим клиентом
    const sessionNumber = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 100);
    console.log('🧮 Generated simple-check session_number:', sessionNumber);

    const testSessionData = {
      user_id: user.id,
      client_id: firstClient.id,
      scheduled_at: new Date().toISOString(),
      format: 'online' as const,
      status: 'scheduled' as const,
      duration: 50,
      price: 1000,
      paid: false,
      receipt_sent: false,
      session_number: sessionNumber
    };
    
    console.log('📝 Attempting to create session with data:', testSessionData);
    
    try {
      const { data: createdSession, error: createError } = await supabase
        .from('sessions')
        .insert([testSessionData])
        .select('*')
        .single();
      
      if (createError) {
        console.error('❌ Session creation error:', {
          message: createError.message,
          code: createError.code,
          details: createError.details,
          hint: createError.hint
        });
        
        // Проверяем специфические ошибки
        if (createError.code === '23503') {
          console.error('🔍 Foreign key constraint violation - checking if client exists for this user');
          
          // Проверяем, существует ли клиент именно для этого пользователя
          const { data: userClient, error: userClientError } = await supabase
            .from('clients')
            .select('id')
            .eq('id', firstClient.id)
            .eq('user_id', user.id)
            .single();
          
          if (userClientError || !userClient) {
            console.error('❌ Client does not belong to current user or does not exist');
            return { 
              success: false, 
              error: `Client ${firstClient.id} does not belong to user ${user.id}`,
              details: { 
                clientId: firstClient.id, 
                userId: user.id,
                clientUserId: firstClient.user_id,
                match: firstClient.user_id === user.id 
              }
            };
          }
        }
        
        return { 
          success: false, 
          error: createError.message, 
          code: createError.code,
          details: createError.details 
        };
      }
      
      console.log('✅ Test session created successfully:', createdSession);
      
      // Удаляем тестовую сессию
      const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .eq('id', createdSession.id);
      
      if (deleteError) {
        console.warn('⚠️ Failed to delete test session:', deleteError);
      } else {
        console.log('🗑️ Test session deleted');
      }
      
      return { 
        success: true, 
        message: 'Test session created and deleted successfully',
        clientIdType: typeof firstClient.id,
        clientIdValue: firstClient.id
      };
      
    } catch (error) {
      console.error('💥 Unexpected error during session creation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
    
  } catch (error) {
    console.error('💥 Unexpected error in debugSimpleCheck:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}