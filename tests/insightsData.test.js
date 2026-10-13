import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildInsightDays, formatInsightValue, getInsightChart, getInsightDates,
  getInsightStats, getInsightSummary,
} from "../src/insightsData.js";

const dates = getInsightDates(new Date(2026, 9, 13, 23, 30));

test("Insights includes exactly seven calendar dates ending today", () => {
  assert.deepEqual(dates, ["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13"]);
  assert.deepEqual(getInsightDates(new Date(2027, 0, 3)), ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
  assert.deepEqual(getInsightDates(new Date(2026, 10, 3)), ["2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03"]);
});

test("rows map by full date and Activity uses the steps column", () => {
  const days = buildInsightDays([
    { log_date: "2026-09-30", hours_slept: 12, steps: 9999 },
    { log_date: "2026-10-07", hours_slept: "6.5", steps: 4200, stress_level: 3 },
    { log_date: "2026-10-14", hours_slept: 10, steps: 10000 },
  ], dates);
  assert.equal(days[0].sleep, 6.5);
  assert.equal(days[0].activity, 4200);
  assert.equal(days[0].stress, 3);
  assert.equal(days[6].sleep, null);
  assert.equal(days.length, 7);
});

test("averages exclude missing days but include a saved zero", () => {
  const days = buildInsightDays([
    { log_date: dates[0], hours_slept: 0, steps: 0, stress_level: 2 },
    { log_date: dates[3], hours_slept: 8, steps: 6000, stress_level: 6 },
    { log_date: dates[6], hours_slept: null, steps: null, stress_level: null },
  ], dates);
  assert.equal(getInsightStats(days, "sleep").average, 4);
  assert.equal(getInsightStats(days, "sleep").count, 2);
  assert.equal(getInsightStats(days, "activity").average, 3000);
  assert.equal(getInsightStats(days, "stress").average, 4);
});

test("an empty period has no measurements or invented summaries", () => {
  const days = buildInsightDays([], dates);
  for (const metric of ["sleep", "stress", "activity"]) {
    const stats = getInsightStats(days, metric);
    assert.equal(stats.average, null);
    assert.equal(stats.count, 0);
    assert.equal(formatInsightValue(stats.average, metric), "Not logged");
    assert.match(getInsightSummary(stats, metric), /No .* entries/);
    assert.deepEqual(getInsightChart(days, metric).segments, []);
  }
});

test("summaries derive peak dates and ties from saved entries", () => {
  const days = buildInsightDays([
    { log_date: dates[0], hours_slept: 8 },
    { log_date: dates[1], hours_slept: 6 },
    { log_date: dates[5], hours_slept: 8 },
  ], dates);
  const stats = getInsightStats(days, "sleep");
  assert.deepEqual(stats.peakDates, ["2026-10-07", "2026-10-12"]);
  assert.match(getInsightSummary(stats, "sleep"), /8h 0m on Oct 7 and Oct 12/);
  const one = getInsightStats(buildInsightDays([{ log_date: dates[2], steps: 0 }], dates), "activity");
  assert.match(getInsightSummary(one, "activity"), /one step entry.*0 steps on Oct 9/);
});

test("chart gaps stay separate and zero values remain visible measurements", () => {
  const days = buildInsightDays([
    { log_date: dates[0], steps: 0 },
    { log_date: dates[1], steps: 500 },
    { log_date: dates[4], steps: 25000 },
  ], dates);
  const chart = getInsightChart(days, "activity");
  assert.equal(chart.max, 25000);
  assert.equal(chart.points[0].y, 130);
  assert.equal(chart.points[4].y, 20);
  assert.equal(chart.points[2].y, null);
  assert.deepEqual(chart.segments.map((segment) => segment.length), [2, 1]);
  assert.ok(chart.segments.flat().every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)));
});

test("null, blank and invalid stored numbers do not turn into zero", () => {
  const days = buildInsightDays([
    { log_date: dates[0], hours_slept: "", steps: "bad", stress_level: null },
    { log_date: dates[1], hours_slept: "7.5", steps: "3000", stress_level: "4" },
  ], dates);
  assert.equal(days[0].sleep, null);
  assert.equal(days[0].activity, null);
  assert.equal(days[1].sleep, 7.5);
  assert.equal(days[1].activity, 3000);
  assert.equal(getInsightStats(days, "sleep").average, 7.5);
});

test("averages use the correct units and round sleep across hour boundaries", () => {
  assert.equal(formatInsightValue(6.999, "sleep"), "7h 0m");
  assert.equal(formatInsightValue(4.25, "stress"), "4.3 / 10");
  assert.equal(formatInsightValue(3000.6, "activity"), "3,001 steps");
});
