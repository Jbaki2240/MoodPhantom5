import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_LOG, createLogPayload, formatSleep, getLocalDate, getLogInsight, toLogForm,
} from "../src/dailyLogData.js";

const date = "2026-10-13";
const validForm = { ...EMPTY_LOG, hours_slept: "7.5", steps: "4200", stress_level: "4" };
const payload = (form, day = date) => createLogPayload(form, day, "user-1", date);

test("a new date has empty measurements rather than sample health data", () => {
  assert.deepEqual(toLogForm(null), EMPTY_LOG);
  assert.throws(() => payload(EMPTY_LOG), /hours slept/);
  assert.match(getLogInsight(null), /No entry/);
});

test("editing preserves zero sleep, zero steps, quality zero, and unchecked meals", () => {
  const saved = { ...validForm, hours_slept: 0, steps: 0, sleep_quality: 0, breakfast_eaten: false };
  const form = toLogForm(saved);
  const result = payload(form);
  assert.equal(result.hours_slept, 0);
  assert.equal(result.steps, 0);
  assert.equal(result.sleep_quality, 0);
  assert.equal(result.breakfast_eaten, false);
  assert.equal(result.meals_logged, 0);
});

test("meal totals are recomputed when an existing meal is unchecked", () => {
  const form = { ...validForm, breakfast_eaten: true, lunch_eaten: true, dinner_eaten: false, meals_logged: 3 };
  assert.equal(payload(form).meals_logged, 2);
  assert.equal(payload({ ...form, lunch_eaten: false }).meals_logged, 1);
});

test("the saved payload uses the signed-in owner and selected calendar date", () => {
  const result = payload(validForm, "2026-10-12");
  assert.equal(result.user_id, "user-1");
  assert.equal(result.log_date, "2026-10-12");
  assert.equal(result.hours_slept, 7.5);
  assert.equal(result.steps, 4200);
  assert.equal(result.stress_level, 4);
  assert.equal(result.sleep_quality, null);
  assert.throws(() => createLogPayload(validForm, date, null, date), /sign in/);
});

test("invalid or missing measurements cannot be saved as accidental zeroes", () => {
  for (const hours of ["", "NaN", -1, 25, Infinity]) {
    assert.throws(() => payload({ ...validForm, hours_slept: hours }), /hours slept/);
  }
  for (const steps of ["", -1, "1.5", "abc", 2147483648]) {
    assert.throws(() => payload({ ...validForm, steps }), /whole number/);
  }
  for (const stress of ["", 0, 11, 1.5, "abc"]) {
    assert.throws(() => payload({ ...validForm, stress_level: stress }), /stress level/);
  }
});

test("invalid, impossible, and future dates are rejected", () => {
  for (const day of ["", "invalid", "2026-02-30", "2026-13-01", "2026-10-14"]) {
    assert.throws(() => payload(validForm, day), /valid date/);
  }
});

test("calendar dates do not shift to UTC around midnight", () => {
  // A local date is derived from calendar parts, even when UTC is tomorrow.
  const localLateEvening = {
    getFullYear: () => 2026, getMonth: () => 9, getDate: () => 13,
    toISOString: () => "2026-10-14T02:30:00.000Z",
  };
  assert.equal(getLocalDate(localLateEvening), "2026-10-13");
});

test("sleep formatting handles zero and rounding across an hour boundary", () => {
  assert.equal(formatSleep(0), "0h 0m");
  assert.equal(formatSleep(7.5), "7h 30m");
  assert.equal(formatSleep(6.999), "7h 0m");
});
