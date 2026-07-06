import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { OAuthProvider } from './env';

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
    // OAuth redirects the whole browser to the provider and back to the app's
    // own origin, so login works in any environment (localhost, preview, prod)
    // without depending solely on the Supabase Site URL. If the provider isn't
    // enabled in Supabase, the SDK returns an error here instead of redirecting,
    // which the caller surfaces to the user. (Magic-link email sign-in was
    // removed — Supabase's built-in email rate limit is too low for real use.)
    signInWithProvider: (provider: OAuthProvider) =>
      supabase!.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } }),
    signOut: () => supabase!.auth.signOut(),
  };
}
