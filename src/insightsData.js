import { formatSleep, getLocalDate } from "./dailyLogData.js";

export const INSIGHT_METRICS = {
  sleep: { label: "Sleep", column: "hours_slept", color: "#8b5cf6" },
  stress: { label: "Stress", column: "stress_level", color: "#ec4899" },
  activity: { label: "Activity", column: "steps", color: "#10b981" },
};

export function getInsightDates(end = new Date()) {
  // Move by local calendar dates, including across daylight-saving changes.
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12);
    day.setDate(day.getDate() - (6 - index));
    return getLocalDate(day);
  });
}

export function formatInsightDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function measurement(value) {
  if (value == null || (typeof value === "string" && value.trim() === "")) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function buildInsightDays(logs, dates) {
  const byDate = new Map(logs.map((log) => [log.log_date, log]));
  return dates.map((date) => {
    const log = byDate.get(date);
    return {
      date,
      day: new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "short" }),
      ...Object.fromEntries(Object.entries(INSIGHT_METRICS).map(([key, { column }]) => [key, measurement(log?.[column])])),
    };
  });
}

export function getInsightStats(days, metric) {
  const recorded = days.filter((day) => day[metric] != null);
  const count = recorded.length;
  if (!count) return { count: 0, average: null, maximum: null, peakDates: [] };
  const maximum = Math.max(...recorded.map((day) => day[metric]));
  return {
    count,
    average: recorded.reduce((total, day) => total + day[metric], 0) / count,
    maximum,
    peakDates: recorded.filter((day) => day[metric] === maximum).map((day) => day.date),
  };
}

export function formatInsightValue(value, metric) {
  if (value == null) return "Not logged";
  if (metric === "sleep") return formatSleep(value);
  if (metric === "stress") return `${Number(value.toFixed(1))} / 10`;
  return `${Math.round(value).toLocaleString("en")} steps`;
}

export function getInsightSummary(stats, metric) {
  const name = metric === "activity" ? "step" : metric;
  if (!stats.count) return `No ${name} entries in the last 7 days. Log your day to see a summary here.`;
  if (stats.count === 1) {
    return `You have one ${name} entry in this period: ${formatInsightValue(stats.maximum, metric)} on ${formatInsightDate(stats.peakDates[0])}. Log more days to compare your entries.`;
  }
  const peakLabel = metric === "sleep" ? "Your longest sleep" : metric === "stress" ? "Your highest logged stress" : "Your highest step count";
  const when = stats.peakDates.length <= 2 ? stats.peakDates.map(formatInsightDate).join(" and ") : `${stats.peakDates.length} days`;
  return `${stats.count} of 7 days have ${name} entries. ${peakLabel} was ${formatInsightValue(stats.maximum, metric)} on ${when}.`;
}

export function getInsightChart(days, metric) {
  const values = days.map((day) => day[metric]).filter((value) => value != null);
  const highest = Math.max(0, ...values);
  const max = metric === "stress" ? Math.max(10, Math.ceil(highest))
    : metric === "activity" ? Math.max(1000, Math.ceil(highest / 1000) * 1000)
    : Math.max(1, Math.ceil(highest));
  const points = days.map((day, index) => ({
    ...day,
    value: day[metric],
    x: 40 + index * 53,
    y: day[metric] == null ? null : 130 - day[metric] / max * 110,
  }));
  // A missing day breaks the line instead of implying a measurement of zero.
  const segments = [];
  let segment = [];
  for (const point of points) {
    if (point.value == null) {
      if (segment.length) segments.push(segment);
      segment = [];
    } else segment.push(point);
  }
  if (segment.length) segments.push(segment);
  return { max, points, segments };
}
