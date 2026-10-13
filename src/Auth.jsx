import React, { useState } from "react";
import { supabase } from "./supabase"; // Points to your lowercase supabase.js
import { Ghost } from "lucide-react"; // Visual anchor for the landing logo
import "./auth.css"; // Imports your styles

export default function Auth() {
  // Track screens: "splash" (the intro), "login" (Welcome Back), or "signup" (Create Account)
  const [authMode, setAuthMode] = useState("splash"); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (authMode === "signup") {
        // Register user with Metadata so your dashboard can say "Good evening, Name"
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
            },
          },
        });

        if (signUpError) throw signUpError;
        alert("Registration complete! Check your email if email confirmation is turned on in Supabase.");
      } else {
        // Log in an existing user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // 🚀 STATE 1: SCREEN ENTRY SPLASH (THE INTRO VIEW)
  if (authMode === "splash") {
    return (
      <div className="intro-splash-container">
        <div className="intro-logo-badge">
          <Ghost size={48} color="#ffffff" />
        </div>
        <h1>MindPhantom</h1>
        <p>Understand your patterns. Sync your health metrics safely.</p>
        <div className="intro-actions-stack">
          <button className="action-primary-btn" onClick={() => setAuthMode("login")}>
            Log In
          </button>
          <button className="action-secondary-btn" onClick={() => setAuthMode("signup")}>
            Create Account
          </button>
        </div>
      </div>
    );
  }

  // 🔐 STATE 2 & 3: FORMS ENTRIES (THE LOGIN / SIGNUP VIEW)
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{authMode === "signup" ? "Create Account" : "Welcome Back"}</h2>
        <p className="auth-subtitle">
          {authMode === "signup" ? "Start tracking metrics with MindPhantom" : "Sign in to access your logs"}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleAuth}>
          {authMode === "signup" && (
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Jannatul"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Processing..." : authMode === "signup" ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p className="auth-toggle">
          {authMode === "signup" ? "Already have an account? " : "New to MindPhantom? "}
          <span onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setError(""); }}>
            {authMode === "signup" ? "Log In" : "Sign Up"}
          </span>
        </p>
        
        {/* Simple button navigation route back to splash landing options */}
        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "0.85rem" }}>
          <span style={{ color: "#64748b", cursor: "pointer" }} onClick={() => { setAuthMode("splash"); setError(""); }}>
            ← Back to Intro
          </span>
        </p>
      </div>
    </div>
  );
}
