import { loadEnv } from "vite";
import { assertImmediateSignup } from "../src/authForm.js";

const config = loadEnv("development", process.cwd(), "VITE_");
const url = config.VITE_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const key = config.VITE_SUPABASE_PUBLISHABLE_KEY;

try {
  if (!url || !key) throw new Error("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.");
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Supabase connection failed (HTTP ${response.status}).`);
  const settings = await response.json();
  console.log(`Supabase connection: OK (${url})`);
  console.log(`Email sign-ups: ${settings.external?.email && !settings.disable_signup ? "enabled" : "disabled"}`);
  console.log(`Confirmation emails: ${settings.mailer_autoconfirm ? "off" : "on"}`);
  assertImmediateSignup(settings);
  console.log("Ready for account creation without confirmation emails.");
} catch (error) {
  console.error(error.message);
  console.error("See supabase/AUTH_SETUP.md for the required dashboard settings.");
  process.exitCode = 1;
}
