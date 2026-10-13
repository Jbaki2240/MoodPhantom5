import { test } from "node:test";
import assert from "node:assert/strict";
import { databaseError } from "../src/dailyLogErrors.js";

test("missing tables, columns and upsert constraints show the setup action", () => {
  for (const code of ["42P01", "42703", "PGRST204", "PGRST205", "42P10"]) {
    const error = databaseError({ code, message: "Missing database field" });
    assert.equal(error.needsDatabaseSetup, true);
    assert.match(error.message, /database update/);
    assert.equal(error.details, `${code}: Missing database field`);
  }
});

test("permission and network errors are not mistaken for a missing migration", () => {
  for (const code of ["42501", "", undefined]) {
    const error = databaseError({ code, message: "Request failed" });
    assert.equal(error.needsDatabaseSetup, false);
    assert.equal(error.message, "Request failed");
  }
});
