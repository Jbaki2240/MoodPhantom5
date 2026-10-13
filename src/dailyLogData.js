export const EMPTY_LOG = {
  hours_slept: "",
  sleep_quality: null,
  breakfast_eaten: false,
  lunch_eaten: false,
  dinner_eaten: false,
  steps: "",
  exercise_type: "None",
  stress_level: "",
};

export const EXERCISE_TYPES = ["None", "Walking", "Running", "Cycling", "Yoga", "Gym"];

// Date inputs and daily logs use the user's calendar day, rather than UTC.
export function getLocalDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getMealsCount(log) {
  return [log.breakfast_eaten, log.lunch_eaten, log.dinner_eaten].filter(Boolean).length;
}

export function toLogForm(log) {
  return Object.fromEntries(Object.entries(EMPTY_LOG).map(([key, fallback]) => [key, log?.[key] ?? fallback]));
}

export function createLogPayload(form, date, userId, today = getLocalDate()) {
  const parsedDate = new Date(`${date}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || getLocalDate(parsedDate) !== date || date > today) {
    throw new Error("Choose a valid date on or before today.");
  }
  if (!userId) throw new Error("Please sign in again before saving your log.");
  const hours = Number(form.hours_slept);
  const steps = Number(form.steps);
  const stress = Number(form.stress_level);
  if (form.hours_slept === "" || !Number.isFinite(hours) || hours < 0 || hours > 24) {
    throw new Error("Enter hours slept between 0 and 24.");
  }
  if (form.steps === "" || !Number.isInteger(steps) || steps < 0 || steps > 2147483647) {
    throw new Error("Enter a whole number of steps between 0 and 2,147,483,647.");
  }
  if (form.stress_level === "" || !Number.isInteger(stress) || stress < 1 || stress > 10) {
    throw new Error("Choose a stress level between 1 and 10.");
  }
  if (form.sleep_quality !== null && (!Number.isInteger(form.sleep_quality) || form.sleep_quality < 0 || form.sleep_quality > 4)) {
    throw new Error("Choose one of the sleep quality options.");
  }
  if (!EXERCISE_TYPES.includes(form.exercise_type)) throw new Error("Choose an exercise type.");
  return {
    user_id: userId,
    log_date: date,
    hours_slept: hours,
    sleep_quality: form.sleep_quality,
    breakfast_eaten: Boolean(form.breakfast_eaten),
    lunch_eaten: Boolean(form.lunch_eaten),
    dinner_eaten: Boolean(form.dinner_eaten),
    meals_logged: getMealsCount(form),
    steps,
    exercise_type: form.exercise_type,
    stress_level: stress,
  };
}

export function formatSleep(hours) {
  const minutes = Math.round(Number(hours) * 60);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function getLogInsight(log) {
  if (!log) return "No entry for today yet. Use Log to save your sleep, meals, activity and stress.";
  const details = [];
  if (log.hours_slept != null) details.push(`${formatSleep(log.hours_slept)} of sleep`);
  if (log.steps != null) details.push(`${Number(log.steps).toLocaleString()} steps`);
  details.push(`${getMealsCount(log)} of 3 meals`);
  if (log.stress_level != null) details.push(`stress at ${log.stress_level}/10`);
  return `Today you logged ${details.join(", ")}.`;
}
