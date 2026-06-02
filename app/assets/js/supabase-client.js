/**
 * Supabase Client
 * Phase 17 - Auth + Account Layer
 */

// Environment-safe configuration
// These will be replaced by build process or environment variables
// For local development, set these in window object or use environment variables
const SUPABASE_URL = window.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'your-anon-key';

// Single client instance (parallel getSupabaseClient() calls must not create duplicate GoTrueClients)
let supabaseClient = null;
let supabaseClientPromise = null;

async function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!supabaseClientPromise) {
    supabaseClientPromise = (async () => {
      try {
        // jsdelivr ESM (esm.sh often blocked or ERR_CONNECTION_CLOSED on some networks)
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm');

        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabase = supabaseClient;
        return supabaseClient;
      } catch (error) {
        console.error('CNError (Supabase Init):', error);
        supabaseClientPromise = null;
        return createMockSupabaseClient();
      }
    })();
  }

  return supabaseClientPromise;
}

function createMockSupabaseClient() {
  return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve({ error: null }),
        resetPasswordForEmail: () => Promise.resolve({ error: null }),
        updateUser: () => Promise.resolve({ data: null, error: null }),
        onAuthStateChange: () => ({ data: { subscription: null }, unsubscribe: () => {} })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => ({ select: () => Promise.resolve({ data: null, error: null }) }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
      })
    };
}

// Export for use in other modules
window.getSupabaseClient = getSupabaseClient;

// Warm singleton on load (auth-session also calls getSupabaseClient — must share one instance)
getSupabaseClient();
