import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, RefreshCw } from "lucide-react";
import { loadDailyLogs } from "./dailyLogs";
import DatabaseErrorNotice from "./DailyLogError";
import {
  INSIGHT_METRICS, buildInsightDays, formatInsightDate, formatInsightValue,
  getInsightChart, getInsightDates, getInsightStats, getInsightSummary,
} from "./insightsData";
import "./insights.css";

function axisLabel(value, metric) {
  if (metric === "sleep") return `${value}h`;
  if (metric === "activity") return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  return String(value);
}

export default function Insights() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("sleep");
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState(() => ({ dates: getInsightDates(), logs: [], loading: true, error: null }));

  useEffect(() => {
    let active = true;
    async function load() {
      setState((previous) => ({ ...previous, loading: true, error: null }));
      const dates = getInsightDates();
      try {
        const logs = await loadDailyLogs(dates[0], dates[6]);
        if (active) setState({ dates, logs, loading: false, error: null });
      } catch (error) {
        if (active) setState({ dates, logs: [], loading: false, error });
      }
    }
    load();
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    const reload = () => setRefresh((value) => value + 1);
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);

  const days = buildInsightDays(state.logs, state.dates);
  const metric = INSIGHT_METRICS[activeTab];
  const stats = getInsightStats(days, activeTab);
  const chart = getInsightChart(days, activeTab);
  const description = `${metric.label} from ${formatInsightDate(state.dates[0])} to ${formatInsightDate(state.dates[6])}. ${stats.count} days logged.`;
  const ticks = [chart.max, chart.max / 2, 0];

  return (
    <div className="insights-container" aria-busy={state.loading}>
      <div className="insights-header">
        <button type="button" className="back-btn" aria-label="Back to home" onClick={() => navigate("/")}><ArrowLeft size={22} /></button>
        <h2>Insights</h2>
        <button type="button" className="back-btn" aria-label="Refresh insights" disabled={state.loading}
          onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={20} /></button>
      </div>

      <div className="insights-tabs" role="group" aria-label="Choose insight metric">
        {Object.entries(INSIGHT_METRICS).map(([key, { label }]) => (
          <button type="button" key={key} className={`tab-btn ${activeTab === key ? "active" : ""}`}
            aria-pressed={activeTab === key} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </div>

      {state.loading && <p className="insights-notice" role="status">Loading your saved logs…</p>}
      {state.error && <DatabaseErrorNotice error={state.error} onRetry={() => setRefresh((value) => value + 1)} retrying={state.loading} />}

      {!state.loading && !state.error && <>
        <p className="insights-period">Last 7 days · {formatInsightDate(state.dates[0])} – {formatInsightDate(state.dates[6])}</p>
        {!stats.count && <div className="insights-empty" role="status">
          <p>No {activeTab === "activity" ? "step" : activeTab} entries for this period.</p>
          <Link to="/log">Log your day</Link>
        </div>}

        <div className="insights-card">
          <h3>{metric.label} Trend</h3>
          <div className="svg-chart-container">
            <svg className="chart-svg" viewBox="0 0 400 180" role="img" aria-label={description}>
              <title>{description} Missing days have no plotted value.</title>
              {ticks.map((tick, index) => <g key={index}>
                <line x1="40" y1={20 + index * 55} x2="358" y2={20 + index * 55} className="grid-line" />
                <text x="0" y={24 + index * 55} className="axis-text">{axisLabel(tick, activeTab)}</text>
              </g>)}
              {chart.segments.filter((segment) => segment.length > 1).map((segment) => (
                <polyline key={segment[0].date} points={segment.map(({ x, y }) => `${x},${y}`).join(" ")}
                  className={`trend-line ${activeTab}-line`} />
              ))}
              {chart.points.filter((point) => point.value != null).map((point) => (
                <circle key={point.date} cx={point.x} cy={point.y} r="4" className={`chart-dot ${activeTab}-dot`}>
                  <title>{formatInsightDate(point.date)}: {formatInsightValue(point.value, activeTab)}</title>
                </circle>
              ))}
              {chart.points.map((point) => <g key={point.date}>
                <text x={point.x} y="151" className="axis-text" textAnchor="middle">{point.day}</text>
                <text x={point.x} y="167" className="axis-text" textAnchor="middle">{formatInsightDate(point.date)}</text>
              </g>)}
            </svg>
          </div>
          <div className="meta-grid">
            <div className="meta-box"><span>Average on logged days</span><p>{formatInsightValue(stats.average, activeTab)}</p></div>
            <div className="meta-box"><span>Days logged</span><p style={{ color: metric.color }}>{stats.count} / 7</p></div>
          </div>
          <p className="insights-note">Missing entries are excluded from the average. Gaps show days without a saved value.</p>
        </div>

        <div className="insights-card">
          <h3>{metric.label} Comparison</h3>
          <div className="svg-chart-container">
            <svg className="chart-svg" viewBox="0 0 400 180" role="img" aria-label={`${description} Daily comparison.`}>
              <title>{description} Bar comparison. Missing days have no bar.</title>
              {ticks.map((tick, index) => <g key={index}>
                <line x1="40" y1={20 + index * 55} x2="358" y2={20 + index * 55} className="grid-line" />
                <text x="0" y={24 + index * 55} className="axis-text">{axisLabel(tick, activeTab)}</text>
              </g>)}
              {chart.points.filter((point) => point.value != null).map((point) => (
                <rect key={point.date} x={point.x - 9} y={point.y} width="18" height={130 - point.y} rx="4" fill={metric.color} className="insight-bar">
                  <title>{formatInsightDate(point.date)}: {formatInsightValue(point.value, activeTab)}</title>
                </rect>
              ))}
              {chart.points.map((point) => <g key={point.date}>
                <text x={point.x} y="151" className="axis-text" textAnchor="middle">{point.day}</text>
                <text x={point.x} y="167" className="axis-text" textAnchor="middle">{formatInsightDate(point.date)}</text>
              </g>)}
            </svg>
          </div>
          <details className="insight-values">
            <summary>View saved daily values</summary>
            <table>
              <caption>{metric.label} entries for this period</caption>
              <thead><tr><th scope="col">Date</th><th scope="col">Saved value</th></tr></thead>
              <tbody>{days.map((day) => <tr key={day.date}>
                <th scope="row">{formatInsightDate(day.date)}</th>
                <td>{formatInsightValue(day[activeTab], activeTab)}</td>
              </tr>)}</tbody>
            </table>
          </details>
        </div>

        <div className="ai-insight-card">
          <div className="ai-text"><h4>Insight Summary</h4><p>{getInsightSummary(stats, activeTab)}</p></div>
          <Lightbulb size={28} color={metric.color} aria-hidden="true" />
        </div>
      </>}
    </div>
  );
}
