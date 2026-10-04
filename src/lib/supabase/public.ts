import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

// For anonymous, read-only storefront queries (RLS already restricts these
// to `status = 'active'` rows). Deliberately doesn't touch next/headers
// cookies, so pages using it aren't forced into dynamic rendering the way
// the cookie-aware admin client (./server.ts) is.
export function createPublicClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase isn't configured yet.");
  }
  return createSupabaseClient(supabaseUrl!, supabaseAnonKey!);
}
