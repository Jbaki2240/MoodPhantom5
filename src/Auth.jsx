import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase, getEmailSignupSettings } from "./supabase";
import { assertImmediateSignup, createSignupPayload, getAuthError, normalizeEmail } from "./authForm";
import { Ghost } from "lucide-react";
import "./auth.css";

export default function Auth({ afterLogout = false, logoutWarning = "" }) {
  const location = useLocation();
  const [selectedAuthMode, setAuthMode] = useState(null);
  const authMode = selectedAuthMode ?? (afterLogout || location.state?.authMode === "login" ? "login" : "splash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ firstName: "", email: "", password: "" });
  const submitting = useRef(false);
  const project = import.meta.env.VITE_SUPABASE_URL?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co(?:\/|$)/i)?.[1];
  const providerUrl = project ? `https://supabase.com/dashboard/project/${project}/auth/providers` : "https://supabase.com/dashboard";

  function changeMode(mode) {
    setAuthMode(mode);
    setError(null);
  }

  function handleChange(event) {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    setError(null);
  }

  async function handleAuth(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setError(null);
    setLoading(true);
    try {
      if (authMode === "signup") {
        const payload = createSignupPayload(formData);
        assertImmediateSignup(await getEmailSignupSettings());
        const { data, error: signUpError } = await supabase.auth.signUp(payload);
        if (signUpError) throw signUpError;
        if (!data.session) {
          const incomplete = new Error("Registration did not return a signed-in session. Please check the sign-up settings or try logging in.");
          incomplete.code = "unexpected_signup_state";
          throw incomplete;
        }
        // App's auth listener opens Home when Supabase returns the new session.
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizeEmail(formData.email), password: formData.password,
        });
        if (signInError) throw signInError;
      }
    } catch (cause) {
      setError(getAuthError(cause));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  if (authMode === "splash") {
    return <div className="intro-splash-container">
      <div className="intro-logo-badge"><Ghost size={48} color="#ffffff" /></div>
      <h1>MindPhantom</h1>
      <p>Understand your patterns. Sync your health metrics safely.</p>
      <div className="intro-actions-stack">
        <button type="button" className="action-primary-btn" onClick={() => changeMode("login")}>Log In</button>
        <button type="button" className="action-secondary-btn" onClick={() => changeMode("signup")}>Create Account</button>
      </div>
    </div>;
  }

  return <div className="auth-container">
    <div className="auth-card">
      <h2>{authMode === "signup" ? "Create Account" : "Welcome Back"}</h2>
      <p className="auth-subtitle">{authMode === "signup" ? "Enter your details to start tracking with MindPhantom." : "Sign in to access your logs"}</p>
      {logoutWarning && <p className="auth-logout-warning" role="alert">{logoutWarning}</p>}
      {error && <div className="error-message" role="alert">
        <p>{error.message}</p>
        {import.meta.env.DEV && error.needsSetup && <div className="auth-setup-help">
          <p>In Supabase's Email provider settings:</p>
          <ol>
            <li>Enable the Email provider and allow new user sign-ups.</li>
            <li>Turn <strong>Confirm email</strong> off, then click <strong>Save</strong>.</li>
            <li>Return here and try <strong>Sign Up</strong> again.</li>
          </ol>
          <a href={providerUrl} target="_blank" rel="noopener noreferrer">Open Supabase Email settings</a>
          <p className="auth-error-code">Error code: {error.code}</p>
        </div>}
      </div>}

      <form className="auth-form" onSubmit={handleAuth} aria-busy={loading}>
        <fieldset className="auth-fields" disabled={loading}>
          <legend className="sr-only">{authMode === "signup" ? "Create an account" : "Log in"}</legend>
          {authMode === "signup" && <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input type="text" id="firstName" name="firstName" required autoComplete="given-name"
              value={formData.firstName} onChange={handleChange} placeholder="Your first name" />
          </div>}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" required autoComplete="email" inputMode="email"
              value={formData.email} onChange={handleChange} placeholder="name@example.com" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required minLength={authMode === "signup" ? 6 : undefined}
              autoComplete={authMode === "signup" ? "new-password" : "current-password"}
              value={formData.password} onChange={handleChange} placeholder="Enter your password" />
          </div>
          <button className="auth-btn" type="submit">{loading ? "Processing…" : authMode === "signup" ? "Sign Up" : "Log In"}</button>
        </fieldset>
      </form>
      <p className="auth-toggle">
        {authMode === "signup" ? "Already have an account? " : "New to MindPhantom? "}
        <button type="button" disabled={loading} onClick={() => changeMode(authMode === "signup" ? "login" : "signup")}>{authMode === "signup" ? "Log In" : "Sign Up"}</button>
      </p>
      <button type="button" className="auth-back" disabled={loading} onClick={() => changeMode("splash")}>← Back to Intro</button>
    </div>
  </div>;
}
