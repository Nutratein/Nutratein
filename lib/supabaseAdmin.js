import { createClient } from '@supabase/supabase-js';

// Server-only client using the service_role key — bypasses RLS.
// NEVER import this file from a 'use client' component or expose it to the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
