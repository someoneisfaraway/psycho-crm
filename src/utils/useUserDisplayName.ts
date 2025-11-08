import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

/**
 * Hook to resolve and keep the current user's display name.
 * Priority: public.users.name → auth.user_metadata.full_name → email local-part.
 * Listens to global "user-display-name-updated" events to update immediately after changes.
 */
export function useUserDisplayName() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!user) {
        if (isActive) setDisplayName('');
        return;
      }

      // Fallbacks
      const emailPart = user.email?.split('@')[0] || '';
      const metaName = (user.user_metadata as any)?.full_name || '';

      try {
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();
        if (error) {
          // If RLS or missing row, fallback
          if (isActive) setDisplayName(metaName || emailPart);
          return;
        }
        const dbName = (data as any)?.name || '';
        if (isActive) setDisplayName(dbName || metaName || emailPart);
      } catch {
        if (isActive) setDisplayName(metaName || emailPart);
      }
    };

    load();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { name?: string } | undefined;
      if (detail?.name) {
        setDisplayName(detail.name);
      }
    };

    window.addEventListener('user-display-name-updated', handler);
    return () => {
      isActive = false;
      window.removeEventListener('user-display-name-updated', handler);
    };
  }, [user]);

  return displayName;
}

