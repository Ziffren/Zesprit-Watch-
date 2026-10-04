import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase isn't configured yet — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}
