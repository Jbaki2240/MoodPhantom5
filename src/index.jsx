import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabase"; // Pointed directly to your supabase.js tab

// Page Components
import Home from "./home";          // Matches your lowercase home.jsx tab
import Auth from "./Auth";          // Matches your uppercase Auth.jsx tab
import LogDaily from "./logDaily";  // Matches your lowercase logDaily.jsx tab
import Insights from "./insights";  // Matches your lowercase insights.jsx tab
import Sidebar from "./sidebar";    // Matches your lowercase sidebar.jsx tab
import Health from "./health";
import Assessment from "./assessment"; // Lowercase match check
import Profile from "./profile"; 

// Styles
import "./styles.css";

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch current active session from Supabase on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Setup real-time listener to handle logins and logouts instantly
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Safe fallback UI layout while verifying server tokens
  if (loading) {
    return (
      <div style={{ background: "#090a0f", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "#ffffff", fontFamily: "sans-serif" }}>
        <p>Verifying secure session...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* PUBLIC AUTH ENTRIES: If user is logged in, skip auth screen and force home entry */}
      <Route 
        path="/auth" 
        element={!session ? <Auth /> : <Navigate to="/" replace />} 
      />

      {/* CORE PROTECTED APPLICATION SHELL */}
      <Route
        path="/*"
        element={
          session ? (
            <div className="app-layout">
              <Sidebar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/log" element={<LogDaily />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/health" element={<Health />} />
                  <Route path="/assessment" element={<Assessment />} />
                   <Route path="/profile" element={<Profile />} />
                  {/* Catch-all safety routing back to homepage grid */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          ) : (
            // If completely unauthenticated, bounce user strictly to registration form
            <Navigate to="/auth" replace />
          )
        }
      />
    </Routes>
  );
};

// Target entry DOM mount rendering configuration
const root = createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
