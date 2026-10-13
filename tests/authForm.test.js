import { test } from "node:test";
import assert from "node:assert/strict";
import { assertImmediateSignup, createSignupPayload, getAuthError, normalizeEmail } from "../src/authForm.js";

test("the form validates email syntax and accepts plus aliases", () => {
  assert.equal(normalizeEmail("  person+demo@gmail.com  "), "person+demo@gmail.com");
  for (const value of ["", "plain text", "person", "person@", "person@domain", "two words@example.com", "person@@example.com"]) {
    assert.throws(() => normalizeEmail(value), /valid email/);
  }
});

test("sign-up trims input and retains the password without adding an email redirect", () => {
  const payload = createSignupPayload({ firstName: "  Demo  ", email: " demo@gmail.com ", password: "pass word!" });
  assert.equal(payload.email, "demo@gmail.com");
  assert.equal(payload.options.data.first_name, "Demo");
  assert.equal(payload.password, "pass word!");
  assert.equal(payload.options.emailRedirectTo, undefined);
});

test("invalid names and passwords are rejected before contacting Supabase", () => {
  assert.throws(() => createSignupPayload({ firstName: " ", email: "demo@gmail.com", password: "password" }), /first name/);
  assert.throws(() => createSignupPayload({ firstName: "Demo", email: "demo@gmail.com", password: "123" }), /at least 6/);
});

test("registration cannot submit while confirmation emails are required or unknown", () => {
  for (const mailer_autoconfirm of [false, undefined]) {
    assert.throws(() => assertImmediateSignup({ external: { email: true }, mailer_autoconfirm }), { code: "email_confirmation_enabled" });
  }
  assert.doesNotThrow(() => assertImmediateSignup({ external: { email: true }, mailer_autoconfirm: true, disable_signup: false }));
});

test("disabled email sign-ups report the actual configuration problem", () => {
  assert.throws(() => assertImmediateSignup({ disable_signup: true }), { code: "signup_disabled" });
  assert.throws(() => assertImmediateSignup({ external: { email: false } }), { code: "email_provider_disabled" });
  assert.equal(getAuthError({ code: "email_confirmation_enabled", message: "Setup needed" }).needsSetup, true);
  assert.equal(getAuthError({ code: "invalid_credentials" }).needsSetup, false);
  assert.match(getAuthError({ code: "user_already_exists" }).message, /Log In/);
});
