import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl } from '@/lib/constants';

// SERVICE-ROLE client. Bypasses Row Level Security — NEVER import this into a
// client component. Only used inside admin-guarded Route Handlers for
// privileged operations (create/disable/delete users, admin DB reads).
export function createAdminClient() {
  const url = getSupabaseUrl();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY / Supabase URL for admin client.',
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
