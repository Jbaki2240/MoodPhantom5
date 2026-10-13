const SETUP_ERROR_CODES = new Set(["42P01", "42703", "PGRST204", "PGRST205", "42P10"]);

export function databaseError(cause, feature = "Daily logging") {
  const error = new Error(SETUP_ERROR_CODES.has(cause.code)
    ? `${feature} is unavailable until the database update is completed.`
    : cause.message || "Could not access your daily logs. Please try again.");
  error.needsDatabaseSetup = SETUP_ERROR_CODES.has(cause.code);
  error.details = [cause.code, cause.message].filter(Boolean).join(": ");
  return error;
}
