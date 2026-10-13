export function normalizeEmail(value) {
  const email = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address, such as name@example.com.");
  }
  return email;
}

export function createSignupPayload(form) {
  const firstName = form.firstName.trim();
  if (!firstName) throw new Error("Enter your first name.");
  if (form.password.length < 6) throw new Error("Use a password with at least 6 characters.");
  return {
    email: normalizeEmail(form.email),
    password: form.password,
    options: { data: { first_name: firstName } },
  };
}

function setupError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function assertImmediateSignup(settings) {
  if (settings.disable_signup) throw setupError("signup_disabled", "New account registration is disabled.");
  if (settings.external?.email !== true) throw setupError("email_provider_disabled", "Email account registration is disabled.");
  // Check before calling signUp so this app does not send confirmation emails.
  if (settings.mailer_autoconfirm !== true) {
    throw setupError("email_confirmation_enabled", "Account creation needs a sign-up settings update before you can continue.");
  }
}

export function getAuthError(error) {
  const messages = {
    email_not_confirmed: "This account still needs email confirmation. Please contact the app owner to activate it.",
    user_already_exists: "This email is already registered. Use Log In instead.",
    invalid_credentials: "The email or password is incorrect.",
    over_email_send_rate_limit: "Account creation was blocked by the email sending limit. Please check the sign-up settings.",
    email_address_not_authorized: "This email could not be registered. Please check the sign-up settings.",
    email_address_invalid: "Enter a valid email address.",
  };
  return {
    message: messages[error.code] || error.message || "Unable to complete this request. Please try again.",
    code: error.code || "",
    needsSetup: ["email_confirmation_enabled", "signup_disabled", "email_provider_disabled", "over_email_send_rate_limit", "email_address_not_authorized", "unexpected_signup_state"].includes(error.code),
  };
}
