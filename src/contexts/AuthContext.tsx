import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (e) {
        console.error('Error fetching session:', e);
      } finally {
        setLoading(false);
      }

      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (event: any, session: any) => {
          setUser(session?.user || null);
          setLoading(false);

          // If the user arrived via a password recovery link, ensure they land on the reset page
          if (event === 'PASSWORD_RECOVERY') {
            const path = window.location.pathname;
            if (path !== '/reset-password') {
              window.location.replace('/reset-password');
            }
          }

          if (event === 'SIGNED_IN' && session?.user) {
            (async () => {
              try {
                const metaName = (session.user.user_metadata as any)?.full_name || '';
                let storedName = '';
                try { storedName = localStorage.getItem('signup_full_name') || ''; } catch {}
                const displayName = (storedName || metaName || (session.user.email?.split('@')[0] || '')).trim();
                // Ensure user row exists
                try {
                  const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', session.user.id)
                    .limit(1);
                  const exists = Array.isArray(existingUser) ? existingUser.length > 0 : !!existingUser;
                  if (!exists) {
                    const { error: rpcError } = await supabase.rpc('ensure_user_exists', {
                      uid: session.user.id,
                      uemail: session.user.email || null,
                    } as any);
                    if (rpcError) {
                      // Fallback to upsert
                      await supabase
                        .from('users')
                        .upsert({ id: session.user.id, email: session.user.email || null, name: displayName }, { onConflict: 'id' } as any);
                    }
                  }
                } catch {}
                // Sync name
                try {
                  if (!metaName && displayName) {
                    await supabase.auth.updateUser({ data: { full_name: displayName } } as any);
                  }
                  await supabase
                    .from('users')
                    .update({ name: displayName })
                    .eq('id', session.user.id);
                  window.dispatchEvent(new CustomEvent('user-display-name-updated', { detail: { name: displayName } }));
                  try { localStorage.removeItem('signup_full_name'); } catch {}
                } catch {}
              } catch {}
            })();
          }
        }
      );

      unsubscribe = () => {
        subscription.unsubscribe();
      };
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      // Login OneSignal with external user id when authenticated
      if (user && (window as any).OneSignalDeferred) {
        (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
          try {
            await OneSignal.login(user.id);
            // Optionally request permission on first login
            await OneSignal.Notifications.requestPermission({ fallbackToSettings: true });
          } catch (e) {
            console.warn('OneSignal login failed:', e);
          }
        });
      }
      // Logout OneSignal on signout
      if (!user && (window as any).OneSignalDeferred) {
        (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
          try { await OneSignal.logout(); } catch {}
        });
      }
    } catch {}
  }, [user]);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectTo = `${import.meta.env.VITE_APP_URL}/auth/callback`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo, data: { full_name: [firstName, lastName].filter(Boolean).join(' ').trim() } },
    } as any);

    if (error) {
      console.error('Sign up error:', error.message);
      throw error;
    }

    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error.message);
      throw error;
    }

    // Ensure context reflects authenticated state immediately
    setUser(data.user ?? null);
    setLoading(false);

    try {
      const u = data.user;
      if (u) {
        const metaName = (u.user_metadata as any)?.full_name || '';
        let storedName = '';
        try { storedName = localStorage.getItem('signup_full_name') || ''; } catch {}
        const displayName = (storedName || metaName || (u.email?.split('@')[0] || '')).trim();
        try {
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', u.id)
            .limit(1);
          const exists = Array.isArray(existingUser) ? existingUser.length > 0 : !!existingUser;
          if (!exists) {
            const { error: rpcError } = await supabase.rpc('ensure_user_exists', {
              uid: u.id,
              uemail: u.email || null,
            } as any);
            if (rpcError) {
              await supabase
                .from('users')
                .upsert({ id: u.id, email: u.email || null, name: displayName }, { onConflict: 'id' } as any);
            }
          }
          if (!metaName && displayName) {
            await supabase.auth.updateUser({ data: { full_name: displayName } } as any);
          }
          await supabase
            .from('users')
            .update({ name: displayName })
            .eq('id', u.id);
          window.dispatchEvent(new CustomEvent('user-display-name-updated', { detail: { name: displayName } }));
          try { localStorage.removeItem('signup_full_name'); } catch {}
        } catch {}
      }
    } catch {}

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
      throw error;
    }
    try {
      if ((window as any).OneSignalDeferred) {
        (window as any).OneSignalDeferred.push(async function(OneSignal: any) { try { await OneSignal.logout(); } catch {} });
      }
    } catch {}
  };

  const forgotPassword = async (email: string) => {
    const appUrl = import.meta.env.VITE_APP_URL;
    if (!appUrl || typeof appUrl !== 'string' || appUrl.trim().length === 0) {
      const err = new Error('VITE_APP_URL is not configured. Set it to your site URL (e.g., https://psycho-crm.vercel.app).');
      console.error('Forgot password error:', err.message);
      throw err;
    }
    const redirectTo = `${appUrl}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo } as any);
    if (error) {
      console.error('Forgot password error:', error.message);
      throw error;
    }
  };

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
