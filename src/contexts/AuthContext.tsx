import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string) => Promise<any>;
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
        (_event: any, session: any) => {
          setUser(session?.user || null);
          setLoading(false);
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

  const signUp = async (email: string, password: string) => {
    const redirectTo = `${import.meta.env.VITE_APP_URL}/auth/callback`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
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

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
      throw error;
    }
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
