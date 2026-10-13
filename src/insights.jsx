// insights.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Fixed: Lowercase 'useNavigate'
import { supabase } from "./supabase"; // Links perfectly to your root configuration
import { ArrowLeft, Moon, Cloud } from "lucide-react";
import "./insights.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Insights() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("sleep"); // 'sleep' | 'stress' | 'activity'
  const [loading, setLoading] = useState(true);
  
  // Clean placeholder state values populated via Supabase logs mapping loop
  const [weeklyData, setWeeklyData] = useState([
    { day: "Mon", sleep: 5.5, stress: 4, steps: 4200 },
    { day: "Tue", sleep: 8.8, stress: 6, steps: 9100 },
    { day: "Wed", sleep: 5.2, stress: 3, steps: 5300 },
    { day: "Thu", sleep: 6.7, stress: 8, steps: 7200 },
    { day: "Fri", sleep: 4.0, stress: 5, steps: 3100 },
    { day: "Sat", sleep: 9.0, stress: 2, steps: 11200 },
    { day: "Sun", sleep: 5.4, stress: 6, steps: 6100 }
  ]);

  const [metrics, setMetrics] = useState({
    avgSleep: "6h 45m",
    sleepInsight: "You slept the most on Saturday. Try to maintain a consistent sleep schedule.",
    avgStress: "4.8 / 10",
    stressInsight: "Your stress peaks during mid-week on Thursday. Practice mindfulness during these days.",
    avgSteps: "6,600 steps",
    activityInsight: "Excellent activity tracking! You crushed your walking targets on Saturday."
  });

  useEffect(() => {
    async function fetchWeeklyAnalytics() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch logs for the past 7 calendar tracking frames
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);

        const { data, error } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", user.id)
          .gte("log_date", start.toISOString().split("T")[0])
          .lte("log_date", end.toISOString().split("T")[0])
          .order("log_date", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Re-map your specific DB arrays matching exact snake_case parameters
          let totalSleep = 0;
          let totalStress = 0;
          let totalSteps = 0;

          const mappedDays = WEEKDAYS.map((dayName, index) => {
            // Find a logged row matching this day's sequence index
            const matchingRow = data.find(row => {
              const logDayIndex = new Date(row.log_date).getDay();
              // Adjust JS Sunday (0) to match layout array sequence index system
              const trackingIndex = logDayIndex === 0 ? 6 : logDayIndex - 1;
              return trackingIndex === index;
            });

            const daySleep = matchingRow ? parseFloat(matchingRow.hours_slept || 0) : weeklyData[index].sleep;
            const dayStress = matchingRow ? parseInt(matchingRow.stress_level || 0) : weeklyData[index].stress;
            const daySteps = matchingRow ? parseInt(matchingRow.steps || 0) : weeklyData[index].steps;

            totalSleep += daySleep;
            totalStress += dayStress;
            totalSteps += daySteps;

            return {
              day: dayName,
              sleep: daySleep,
              stress: dayStress,
              steps: daySteps
            };
          });

          setWeeklyData(mappedDays);

          // Calculate Dynamic Metric Averages
          const avgS = totalSleep / 7;
          const avgHours = Math.floor(avgS);
          const avgMins = Math.round((avgS - avgHours) * 60);

          setMetrics(prev => ({
            ...prev,
            avgSleep: `${avgHours}h ${avgMins}m`,
            avgStress: `${(totalStress / 7).toFixed(1)} / 10`,
            avgSteps: `${Math.round(totalSteps / 7).toLocaleString()} steps`
          }));
        }
      } catch (err) {
        console.error("Error drawing analytical metric summaries:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchWeeklyAnalytics();
  }, []);

  // Helper calculation definitions to project SVG polyline vectors
  const getSvgPathCoordinates = () => {
    let maxVal = activeTab === "sleep" ? 10 : activeTab === "stress" ? 10 : 12000;
    return weeklyData.map((d, index) => {
      const val = d[activeTab];
      const x = 35 + index * 53; // Responsive horizontal text offset intervals
      const y = 140 - (val / maxVal) * 110; // Vertical compression mapping
      return { x, y };
    }).map(p => `${p.x},${p.y}`).join(" ");
  };

  const coordinates = getSvgPathCoordinates().split(" ");

  return (
    <div className="insights-container">
      {/* HEADER BAR */}
      <div className="insights-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={22} />
        </button>
        <h2>Insights</h2>
      </div>

      {/* TOP NAVIGATION SUB TABS SWITCHER */}
      <div className="insights-tabs">
        <button className={`tab-btn ${activeTab === "sleep" ? "active" : ""}`} onClick={() => setActiveTab("sleep")}>Sleep</button>
        <button className={`tab-btn ${activeTab === "stress" ? "active" : ""}`} onClick={() => setActiveTab("stress")}>Stress</button>
        <button className={`tab-btn ${activeTab === "activity" ? "active" : ""}`} onClick={() => setActiveTab("activity")}>Activity</button>
      </div>

      {/* LINE TREND TREND-CARD PANEL */}
      <div className="insights-card">
        <h3 style={{ textTransform: "capitalize" }}>{activeTab} <span style={{color: '#64748b', fontSize: '0.8rem', fontWeight: 400}}>(Last 7 Days)</span></h3>
        
        <div className="svg-chart-container">
          <svg className="chart-svg">
            {/* Background Grid Accent Lines */}
            <line x1="30" y1="30" x2="360" y2="30" className="grid-line" />
            <text x="5" y="34" className="axis-text">{activeTab === "activity" ? "10k" : "8h"}</text>
            
            <line x1="30" y1="75" x2="360" y2="75" className="grid-line" />
            <text x="5" y="79" className="axis-text">{activeTab === "activity" ? "5k" : "5h"}</text>
            
            <line x1="30" y1="120" x2="360" y2="120" className="grid-line" />
            <text x="5" y="124" className="axis-text">0h</text>

            {/* SVG Trend Polyline Graph vector stroke mapping */}
            <polyline
              points={getSvgPathCoordinates()}
              className={`trend-line ${activeTab}-line`}
            />

            {/* Interactive node dot nodes matching design specs */}
            {coordinates.map((coord, i) => {
              const [x, y] = coord.split(",");
              return x && y ? (
                <circle key={i} cx={x} cy={y} r={4} className={`chart-dot ${activeTab}-dot`} />
              ) : null;
            })}

            {/* Horizontal day labels */}
            {WEEKDAYS.map((day, idx) => (
              <text key={idx} x={35 + idx * 53} y="152" className="axis-text" textAnchor="middle">{day}</text>
            ))}
          </svg>
        </div>

        {/* METRICS SUMMARY SECTION COMPONENT BLOCK */}
        <div className="meta-grid">
          <div className="meta-box">
            <span>Weekly Average</span>
            <p>{activeTab === "sleep" ? metrics.avgSleep : activeTab === "stress" ? metrics.avgStress : metrics.avgSteps}</p>
          </div>
          <div className="meta-box">
            <span>Goal Target</span>
            <p style={{ color: activeTab === "sleep" ? "#8b5cf6" : activeTab === "stress" ? "#ec4899" : "#10b981" }}>
              {activeTab === "sleep" ? "7h" : activeTab === "stress" ? "< 4" : "10k"}
            </p>
          </div>
        </div>
      </div>

      {/* BAR CHART HISTOGRAM ELEMENT PANEL */}
      <div className="insights-card">
        <h3 style={{ textTransform: "capitalize" }}>{activeTab} Comparison</h3>
        
        <div className="bar-chart-container">
          <div className="bar-y-axis">
            <span>{activeTab === "activity" ? "10k" : "10h"}</span>
            <span>{activeTab === "activity" ? "5k" : "5h"}</span>
            <span>0</span>
          </div>

          {weeklyData.map((dataObj, index) => {
            const rawVal = dataObj[activeTab];
            const maxConstraint = activeTab === "activity" ? 12000 : 10;
            const barHeightPercentage = `${Math.min((rawVal / maxConstraint) * 100, 100)}%`;
            
            // Matches dynamic coloring parameters from dashboard
            const themeColor = activeTab === "sleep" ? "linear-gradient(180deg, #8b5cf6, #3b82f6)" : activeTab === "stress" ? "linear-gradient(180deg, #ec4899, #f43f5e)" : "linear-gradient(180deg, #10b981, #059669)";

            return (
              <div key={index} className="bar-column">
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: barHeightPercentage, background: themeColor }} />
                </div>
                <span>{dataObj.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM INTELLIGENT WRAPPED AI INSIGHT BANNER */}
      <div className="ai-insight-card">
        <div className="ai-text">
          <h4>Insight Summary</h4>
          <p>{activeTab === "sleep" ? metrics.sleepInsight : activeTab === "stress" ? metrics.stressInsight : metrics.activityInsight}</p>
        </div>
        <div className="ai-visual">
          <Moon size={28} className="moon-svg" fill="#fcd34d" />
          <Cloud size={20} className="cloud-svg" fill="#cbd5e1" />
        </div>
      </div>
    </div>
  );
}
