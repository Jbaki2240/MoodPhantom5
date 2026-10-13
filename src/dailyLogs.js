import { supabase } from "./supabase";
import { createLogPayload } from "./dailyLogData";
import { databaseError } from "./dailyLogErrors";

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in again to access your logs.");
  return data.user;
}

export async function loadDailyLog(date) {
  const user = await currentUser();
  const { data, error } = await supabase.from("daily_logs")
    .select("hours_slept,sleep_quality,breakfast_eaten,lunch_eaten,dinner_eaten,steps,exercise_type,stress_level")
    .eq("user_id", user.id)
    .eq("log_date", date)
    .maybeSingle();
  if (error) throw databaseError(error);
  return data;
}

export async function loadDailyLogs(startDate, endDate) {
  const user = await currentUser();
  const { data, error } = await supabase.from("daily_logs")
    .select("log_date,hours_slept,stress_level,steps")
    .eq("user_id", user.id)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: true });
  if (error) throw databaseError(error, "Insights");
  return data ?? [];
}

export async function saveDailyLog(form, date) {
  const user = await currentUser();
  const payload = createLogPayload(form, date, user.id);
  // One row per person and date; saving an existing date updates that row.
  const { data, error } = await supabase.from("daily_logs")
    .upsert(payload, { onConflict: "user_id,log_date" })
    .select("log_date")
    .single();
  if (error) throw databaseError(error);
  return data;
}
