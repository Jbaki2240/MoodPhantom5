import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabase";
import Home from "./home";
import Auth from "./Auth";
import LogDaily from "./logDaily";
import Insights from "./insights";
import Sidebar from "./sidebar";
import Health from "./health";
import Assessment from "./assessment";
import Profile from "./profile";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutNotice, setLogoutNotice] = useState(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    }).catch(() => {
      if (active) {
        setSession(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "SIGNED_OUT") setLogoutNotice({ warning: "" });
      else if (nextSession) setLogoutNotice(null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  if (loading) {
    return <div style={{ background: "#090a0f", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "#ffffff", fontFamily: "sans-serif" }}>
      <p>Verifying secure session...</p>
    </div>;
  }

  return (
    <Routes>
      <Route path="/auth" element={!session
        ? <Auth afterLogout={Boolean(logoutNotice)} logoutWarning={logoutNotice?.warning} />
        : <Navigate to="/" replace />} />
      <Route path="/*" element={session ? (
        <div className="app-layout" key={session.user.id}>
          <Sidebar onLogoutComplete={(warning) => setLogoutNotice({ warning })} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home user={session.user} />} />
              <Route path="/log" element={<LogDaily />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/health" element={<Health />} />
              <Route path="/assessment" element={<Assessment />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      ) : <Navigate to="/auth" replace state={logoutNotice ? { authMode: "login" } : undefined} />} />
    </Routes>
  );
}
