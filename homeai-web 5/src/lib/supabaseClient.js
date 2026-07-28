import { createClient } from "@supabase/supabase-js";

// These come from your Supabase project → Settings → API. Only the anon
// public key belongs in frontend code — the service_role key stays on the
// backend only (see homeai-backend/lib/supabase.js).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
