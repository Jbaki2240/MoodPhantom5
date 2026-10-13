import { createClient } from "@supabase/supabase-js";

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Force-remove any accidental /rest/v1/ or trailing slashes
if (supabaseUrl && supabaseUrl.includes("/rest/v1")) {
  supabaseUrl = supabaseUrl.replace("/rest/v1", "").replace(/\/$/, "");
}

console.log("Cleaned Supabase URL being used:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey);
