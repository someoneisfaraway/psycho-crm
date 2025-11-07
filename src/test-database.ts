// Test database connection and basic operations
import { supabase } from './config/supabase';

export async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test 1: Check if we can query the sessions table
    console.log('Test 1: Querying sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError) {
      console.error('Sessions query error:', sessionsError);
    } else {
      console.log('Sessions query successful, found:', sessions?.length || 0, 'sessions');
      if (sessions && sessions.length > 0) {
        console.log('First session structure:', Object.keys(sessions[0]));
      }
    }
    
    // Test 2: Check if we can query the clients table
    console.log('Test 2: Querying clients table...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientsError) {
      console.error('Clients query error:', clientsError);
    } else {
      console.log('Clients query successful, found:', clients?.length || 0, 'clients');
      if (clients && clients.length > 0) {
        console.log('First client structure:', Object.keys(clients[0]));
      }
    }
    
    // Test 3: Check current user
    console.log('Test 3: Checking current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User check error:', userError);
    } else {
      console.log('Current user:', user);
    }
    
    return {
      sessionsError,
      clientsError,
      userError,
      user,
      sessions: sessions?.length || 0,
      clients: clients?.length || 0
    };
    
  } catch (error) {
    console.error('Database test failed:', error);
    return { error };
  }
}

// Test creating a minimal session
export async function testCreateMinimalSession() {
  console.log('Testing minimal session creation...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user');
      return { error: 'No authenticated user' };
    }
    
    // Get first client for the user
    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (!clients || clients.length === 0) {
      console.error('No clients found for user');
      return { error: 'No clients found' };
    }
    
    const testSession = {
      user_id: user.id,
      client_id: clients[0].id,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      format: 'online',
      price: 100,
      status: 'scheduled'
    };
    
    console.log('Creating test session with data:', testSession);
    
    const { data, error } = await supabase
      .from('sessions')
      .insert([testSession])
      .select('*')
      .single();
    
    if (error) {
      console.error('Test session creation failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      return { error };
    }
    
    console.log('Test session created successfully:', data);
    return { data };
    
  } catch (error) {
    console.error('Test creation failed:', error);
    return { error };
  }
}