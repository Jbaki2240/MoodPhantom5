import { useState } from "react";
import dailyLogsSetupSql from "../supabase/migrations/202610130001_daily_logs.sql?raw";
import "./dailyLogError.css";

function sqlEditorUrl() {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  const project = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co(?:\/|$)/i)?.[1];
  return project ? `https://supabase.com/dashboard/project/${project}/sql/new` : "https://supabase.com/dashboard";
}

export default function DailyLogError({ error, onRetry, retrying = false, setupSql = import.meta.env.DEV ? dailyLogsSetupSql : "" }) {
  const [copyStatus, setCopyStatus] = useState("");
  // Database setup belongs to the project owner during local development.
  const showSetup = import.meta.env.DEV && error.needsDatabaseSetup;

  async function copySql() {
    try {
      await navigator.clipboard.writeText(setupSql);
      setCopyStatus("Copied. Open Supabase SQL Editor, paste the SQL, and click Run.");
    } catch {
      setCopyStatus("Copy was unavailable. Open Show setup SQL below, select the text, and copy it manually.");
    }
  }

  return (
    <div className="daily-log-error" role="alert">
      <p>{error.message}</p>
      {showSetup && (
        <div className="daily-log-setup">
          <h3>Finish database setup</h3>
          <p>The SQL file in your project must be run in Supabase to update the cloud database.</p>
          <ol>
            <li>Click <strong>Copy setup SQL</strong>.</li>
            <li>Open Supabase SQL Editor, paste the SQL into the new query, and click <strong>Run</strong>.</li>
            <li>After Supabase reports success, return here and click <strong>Check database again</strong>.</li>
          </ol>
          <div className="daily-log-error-actions">
            <button type="button" onClick={copySql}>Copy setup SQL</button>
            <a href={sqlEditorUrl()} target="_blank" rel="noopener noreferrer">Open Supabase SQL Editor</a>
          </div>
          {copyStatus && <p role="status">{copyStatus}</p>}
          <details>
            <summary>Show setup SQL</summary>
            <textarea aria-label="Database setup SQL" value={setupSql} readOnly onFocus={(event) => event.target.select()} />
          </details>
          <details>
            <summary>Database error details</summary>
            <pre>{error.details}</pre>
          </details>
        </div>
      )}
      <button type="button" onClick={onRetry} disabled={retrying}>
        {showSetup ? "Check database again" : "Try again"}
      </button>
    </div>
  );
}
