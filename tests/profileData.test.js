import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_PROFILE, createProfilePayload, toProfileForm } from "../src/profileData.js";
import { databaseError } from "../src/dailyLogErrors.js";

test("missing profile details remain empty without fabricated personal information", () => {
  assert.deepEqual(toProfileForm(null), EMPTY_PROFILE);
  assert.deepEqual(toProfileForm({ age: null, gender: null }), EMPTY_PROFILE);
  const payload = createProfilePayload(EMPTY_PROFILE, "user-1");
  assert.equal(payload.age, null);
  assert.equal(payload.gender, null);
  assert.equal(payload.occupation, null);
  assert.equal(payload.food_habit, null);
});

test("profile fields map to Supabase columns and preserve an age of zero", () => {
  const form = toProfileForm({ age: 0, gender: "Other", occupation: "Student", food_habit: "Vegan" });
  const payload = createProfilePayload(form, "user-1");
  assert.equal(payload.id, "user-1");
  assert.equal(payload.age, 0);
  assert.equal(payload.gender, "Other");
  assert.equal(payload.occupation, "Student");
  assert.equal(payload.food_habit, "Vegan");
});

test("clearing personal details stores null instead of sample values", () => {
  const payload = createProfilePayload({ ...EMPTY_PROFILE, occupation: "  " }, "user-1");
  assert.equal(payload.occupation, null);
  assert.equal(payload.age, null);
  assert.equal(createProfilePayload({ ...EMPTY_PROFILE, occupation: "  Teacher  " }, "user-1").occupation, "Teacher");
});

test("invalid profile ages and unauthenticated saves are rejected", () => {
  for (const age of [-1, 151, 2.5, "abc"]) {
    assert.throws(() => createProfilePayload({ ...EMPTY_PROFILE, age }, "user-1"), /whole-number age/);
  }
  assert.throws(() => createProfilePayload(EMPTY_PROFILE, null), /sign in/);
});

test("profile setup errors identify profile editing rather than daily logging", () => {
  const error = databaseError({ code: "42703", message: "column profiles.age does not exist" }, "Profile editing");
  assert.equal(error.needsDatabaseSetup, true);
  assert.match(error.message, /^Profile editing/);
});
