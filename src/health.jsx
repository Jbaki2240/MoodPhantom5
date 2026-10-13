// health.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 👈 1. IMPORT THE ROUTER NAVIGATE HOOK
import { supabase } from "./supabase"; 
import { Menu, ChevronRight, Check } from "lucide-react";
import "./health.css";

export default function Health() {
  const navigate = useNavigate(); // 👈 2. INITIALIZE THE NAVIGATE FUNCTION
  const [loading, setLoading] = useState(true);
  
  // Local active checklist tracking loops
  const [meds, setMeds] = useState({
    morning: true,
    evening: false
  });

  // Dynamic measurements state holding your UI targets
  const [metrics, setMetrics] = useState({
    bloodSugar: 120,
    bloodPressure: "118/76",
    weight: 65
  });

  useEffect(() => {
    async function fetchHealthProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetches your logs sorted by latest entry to populate health metrics panels automatically
        const { data, error } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("log_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Future mapping can go here
        }
      } catch (err) {
        console.error("Error connecting medical profile summary layers:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHealthProfile();
  }, []);

  const toggleMed = (timeKey) => {
    setMeds(prev => ({ ...prev, [timeKey]: !prev[timeKey] }));
  };

  if (loading) {
    return (
      <div className="health-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Syncing vital systems...</p>
      </div>
    );
  }

  return (
    <div className="health-container">
      {/* HEADER BAR */}
      <div className="health-header">
        <button className="menu-btn" onClick={() => alert("Opening navigation drawer...")}>
          <Menu size={22} />
        </button>
        <h2>Health</h2>
      </div>

      {/* MY CONDITIONS SECTION */}
      <div className="health-card">
        <h3>My Conditions</h3>
        <div className="condition-item" onClick={() => alert("Viewing full clinical treatment files...")}>
          <div className="condition-info">
            <h4>Diabetes (Type 2)</h4>
            <span>Added on 12 May 2024</span>
          </div>
          <ChevronRight size={18} className="chevron-right" />
        </div>
      </div>

      {/* MEDICATION TRACKER BOX */}
      <div className="health-card">
        <h3>Medication Tracker</h3>
        <div className="med-tracker-box">
          <div className="med-title">Metformin 500mg</div>
          
          <div className="med-row">
            <span>Morning (After Breakfast)</span>
            <div 
              className={`health-checkbox ${meds.morning ? "checked" : ""}`} 
              onClick={() => toggleMed("morning")}
            >
              <Check size={14} strokeWidth={3} />
            </div>
          </div>

          <div className="med-row">
            <span>Evening (After Dinner)</span>
            <div 
              className={`health-checkbox ${meds.evening ? "checked" : ""}`} 
              onClick={() => toggleMed("evening")}
            >
              <Check size={14} strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>

      {/* HEALTH MEASUREMENTS COMPACT BOXES GRID */}
      <div className="health-card">
        <h3>Health Measurements</h3>
        <div className="measurements-grid">
          
          <div className="measure-box">
            <span className="measure-label">Blood Sugar</span>
            <div className="measure-value">{metrics.bloodSugar}</div>
            <span className="measure-unit">mg/dL</span>
          </div>

          <div className="measure-box">
            <span className="measure-label">Blood Pressure</span>
            <div className="measure-value" style={{ fontSize: '1.15rem', padding: '2px 0' }}>{metrics.bloodPressure}</div>
            <span className="measure-unit">mmHg</span>
          </div>

          <div className="measure-box">
            <span className="measure-label">Weight</span>
            <div className="measure-value">{metrics.weight}</div>
            <span className="measure-unit">kg</span>
          </div>

        </div>
      </div>

      {/* MENTAL HEALTH ASSESSMENT INTERACTION BANNER */}
      <div className="health-card">
        <h3>Mental Health Assessment</h3>
        <p className="assessment-text">
          Answer a few questions to know your mental well-being.
        </p>
        
        <button className="assessment-btn" onClick={() => navigate("/assessment")}>
          Take Assessment
        </button>
      </div>
    </div>
  );
}
