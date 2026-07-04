import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    session,
    loading,
    available: !!supabase,
    // Redirect the magic link back to wherever the app is actually running,
    // so login works in any environment (localhost, preview, production)
    // without depending solely on the Supabase dashboard Site URL setting.
    signInWithEmail: (email: string) =>
      supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } }),
    signOut: () => supabase!.auth.signOut(),
  };
}
