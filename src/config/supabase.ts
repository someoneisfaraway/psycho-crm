import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrlRaw = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKeyRaw = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = typeof supabaseUrlRaw === 'string' ? supabaseUrlRaw.trim() : '';
const supabaseAnonKey = typeof supabaseAnonKeyRaw === 'string' ? supabaseAnonKeyRaw.trim() : '';

// Fallback stub to prevent the app from crashing when env vars are not configured during local preview.
function createSupabaseStub(): SupabaseClient {
  const result = { data: null, error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.') } as any;

  const makeBuilder = () => {
    const builder: any = {
      select: () => builder,
      insert: () => builder,
      update: () => builder,
      delete: () => builder,
      upsert: () => builder,
      eq: () => builder,
      in: () => builder,
      gte: () => builder,
      lte: () => builder,
      order: () => builder,
      single: () => builder,
      limit: () => builder,
      range: () => builder,
      then: (onFulfilled: any, onRejected?: any) => Promise.resolve(result).then(onFulfilled, onRejected),
      catch: (onRejected: any) => Promise.resolve(result).catch(onRejected),
      finally: (onFinally: any) => Promise.resolve().finally(onFinally),
    };
    return builder;
  };

  const stub: any = {
    from: (_table: string) => makeBuilder(),
    rpc: (_fn: string, _args?: any) => Promise.resolve(result),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (_cb: any) => Promise.resolve({ data: { subscription: { unsubscribe() {} } }, error: null }),
      signUp: (_opts: any) => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signInWithPassword: (_opts: any) => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: (_email: string) => Promise.resolve({ data: {}, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  };
  return stub as SupabaseClient;
}

let supabase: SupabaseClient;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase URL or Anon Key in environment variables. Using stubbed client for preview.');
    supabase = createSupabaseStub();
  } else {
    // Log for debugging in dev to confirm env values are loaded
    if (import.meta.env.DEV) {
      console.log('[Supabase Init] URL:', supabaseUrl, 'AnonKey length:', supabaseAnonKey.length);
    }
    // Avoid early URL validation to prevent false negatives; let supabase-js handle its own validation
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  console.error('Failed to initialize Supabase, falling back to stub:', e);
  supabase = createSupabaseStub();
}

export { supabase };