import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Utensils, Activity, Brain } from "lucide-react";
import { loadDailyLog, saveDailyLog } from "./dailyLogs";
import DailyLogError from "./DailyLogError";
import { EMPTY_LOG, EXERCISE_TYPES, getLocalDate, toLogForm } from "./dailyLogData";
import "./logDaily.css";

// Keep the original numeric indices so saved quality selections retain meaning.
const QUALITY_OPTIONS = [
  { emoji: "🥵", label: "Very restless" },
  { emoji: "😁", label: "Excellent" },
  { emoji: "🙂", label: "Good" },
  { emoji: "🤨", label: "Fair" },
  { emoji: "😩", label: "Poor" },
];

export default function LogDaily() {
  const navigate = useNavigate();
  const location = useLocation();
  const [date, setDate] = useState(getLocalDate);
  const [form, setForm] = useState({ ...EMPTY_LOG });
  const [loadedDate, setLoadedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState(false);
  const [retry, setRetry] = useState(0);
  const saving = useRef(false);
  const dirty = useRef(false);
  const ready = !loading && loadedDate === date && !loadError;

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      setSaveError(null);
      try {
        const data = await loadDailyLog(date);
        if (active) {
          if (!dirty.current) setForm(toLogForm(data));
          setExisting(Boolean(data));
          setLoadedDate(date);
        }
      } catch (err) {
        if (active) {
          setLoadedDate(null);
          setLoadError(err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [date, retry]);

  useEffect(() => {
    if (ready && location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [ready, location.hash]);

  function update(name, value) {
    dirty.current = true;
    setForm((previous) => ({ ...previous, [name]: value }));
    setSaveError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!ready || saving.current) return;
    saving.current = true;
    setSubmitting(true);
    setSaveError(null);
    try {
      const saved = await saveDailyLog(form, date);
      navigate("/", { state: { savedDate: saved.log_date } });
    } catch (err) {
      setSaveError(err);
    } finally {
      saving.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="log-container">
      <div className="log-header">
        <button type="button" className="back-btn" aria-label="Back to home" disabled={submitting} onClick={() => navigate("/")}>
          <ArrowLeft size={22} />
        </button>
        <h2>Log Daily</h2>
      </div>
      <div className="log-date-field">
        <label htmlFor="log-date">Log date</label>
        <input id="log-date" type="date" required max={getLocalDate()} value={date} disabled={submitting}
          onChange={(event) => {
            if (event.target.value && event.target.value !== date) {
              dirty.current = false;
              setDate(event.target.value);
            }
          }} />
      </div>
      {loading && <p className="log-notice" role="status">Loading your saved entry…</p>}
      {(loadError || saveError) && <DailyLogError error={loadError || saveError}
        onRetry={() => setRetry((value) => value + 1)} retrying={loading || submitting} />}
      {ready && <p className="log-notice">{existing ? "Edit your saved entry. Saving will update this date." : "No entry for this date yet. Fill in your daily log below."}</p>}
      <form onSubmit={handleSubmit} aria-busy={loading || submitting}>
        <fieldset className="log-fields" disabled={!ready || submitting}>
          <legend className="sr-only">Daily health log</legend>
          <section className="log-card" id="sleep" aria-labelledby="sleep-title">
            <h3 className="card-title sleep-title" id="sleep-title"><Moon size={18} />Sleep</h3>
            <div className="input-box">
              <label htmlFor="hours-slept">Hours slept (last night)</label>
              <div className="input-wrapper">
                <input id="hours-slept" name="hours_slept" type="number" min="0" max="24" step="0.1" required
                  value={form.hours_slept} onChange={(event) => update("hours_slept", event.target.value)} placeholder="e.g. 7.5" />
                <span className="unit">hours</span>
              </div>
            </div>
            <div className="sub-label quality-label" id="quality-label">Sleep quality (optional)</div>
            <div className="emoji-row" role="group" aria-labelledby="quality-label">
              {QUALITY_OPTIONS.map(({ emoji, label }, index) => (
                <button type="button" key={label} className={`emoji-btn ${form.sleep_quality === index ? "active" : ""}`}
                  aria-label={label} title={label} aria-pressed={form.sleep_quality === index}
                  onClick={() => update("sleep_quality", form.sleep_quality === index ? null : index)}>{emoji}</button>
              ))}
            </div>
          </section>
          <section className="log-card" id="meals" aria-labelledby="meals-title">
            <h3 className="card-title meals-title" id="meals-title"><Utensils size={18} />Meals</h3>
            <div className="meals-grid">
              {[["breakfast_eaten", "Breakfast"], ["lunch_eaten", "Lunch"], ["dinner_eaten", "Dinner"]].map(([name, label]) => (
                <label className="meal-option" key={name}>
                  <span>{label}</span>
                  <input type="checkbox" name={name} className="meal-input" checked={form[name]}
                    onChange={(event) => update(name, event.target.checked)} />
                </label>
              ))}
            </div>
          </section>
          <section className="log-card" id="activity" aria-labelledby="activity-title">
            <h3 className="card-title activity-title" id="activity-title"><Activity size={18} />Activity</h3>
            <div className="activity-row">
              <div className="input-box">
                <label htmlFor="steps">Steps</label>
                <div className="input-wrapper">
                  <input id="steps" name="steps" type="number" min="0" max="2147483647" step="1" required placeholder="e.g. 4200"
                    value={form.steps} onChange={(event) => update("steps", event.target.value)} />
                </div>
              </div>
              <div className="input-box">
                <label htmlFor="exercise-type">Sports / Exercise</label>
                <div className="input-wrapper">
                  <select id="exercise-type" name="exercise_type" value={form.exercise_type} onChange={(event) => update("exercise_type", event.target.value)}>
                    {EXERCISE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </section>
          <section className="log-card" id="stress" aria-labelledby="stress-title">
            <h3 className="card-title stress-title" id="stress-title"><Brain size={18} />Stress Level</h3>
            <div className="input-box">
              <label htmlFor="stress-level">How stressed did you feel? (1 = low, 10 = high)</label>
              <div className="input-wrapper">
                <input id="stress-level" name="stress_level" type="number" min="1" max="10" step="1" required placeholder="1–10"
                  value={form.stress_level} onChange={(event) => update("stress_level", event.target.value)} />
              </div>
            </div>
          </section>
          <button className="save-btn" type="submit">{submitting ? "Saving…" : existing ? "Update daily log" : "Save daily log"}</button>
        </fieldset>
      </form>
    </div>
  );
}
