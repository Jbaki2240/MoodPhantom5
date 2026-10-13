// logDaily.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase"; // Pointed directly to your root level supabase.js file
import { ArrowLeft, Calendar, Moon, Utensils, Activity, Brain, Check } from "lucide-react";
import "./logDaily.css";

const QUALITY_EMOJIS = ["🥵", "😁", "🙂", "🤨", "😩"];

export default function LogDaily() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Form states matching your exact schema columns
  const [hoursSlept, setHoursSlept] = useState(6.0);
  const [sleepQuality, setSleepQuality] = useState(1); // Mapped to your int4 column
  const [breakfastEaten, setBreakfastEaten] = useState(true);
  const [lunchEaten, setLunchEaten] = useState(true);
  const [dinnerEaten, setDinnerEaten] = useState(false);
  const [steps, setSteps] = useState(7420);
  const [exerciseType, setExerciseType] = useState("Walking");
  const [stressLevel, setStressLevel] = useState(7);

  const getTodayDateString = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Pre-load data from your table if an entry already exists for today
  useEffect(() => {
    async function loadTodayData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("log_date", getTodayDateString())
          .maybeSingle();

        if (data) {
          setHoursSlept(data.hours_slept || 6.0);
          setSleepQuality(data.sleep_quality !== undefined ? data.sleep_quality : 1);
          setBreakfastEaten(data.breakfast_eaten || false);
          setLunchEaten(data.lunch_eaten || false);
          setDinnerEaten(data.dinner_eaten || false);
          setSteps(data.steps || 0);
          setExerciseType(data.exercise_type || "Walking");
          setStressLevel(data.stress_level || 5);
        }
      } catch (err) {
        console.error("Error pre-loading existing logs:", err.message);
      }
    }
    loadTodayData();
  }, []);

  const handleSaveData = async () => {
    setSubmitting(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error("No active user session found.");

      // Calculate total meals logged to show summary metrics on your main dashboard
      const totalMealsLogged = [breakfastEaten, lunchEaten, dinnerEaten].filter(Boolean).length;

      const { error } = await supabase.from("daily_logs").upsert(
        {
          user_id: user.id,
          log_date: getTodayDateString(),
          hours_slept: parseFloat(hoursSlept),
          sleep_quality: parseInt(sleepQuality),
          breakfast_eaten: breakfastEaten,
          lunch_eaten: lunchEaten,
          dinner_eaten: dinnerEaten,
          meals_logged: totalMealsLogged, // Helper summary calculation field
          steps: parseInt(steps) || 0,
          exercise_type: exerciseType,
          stress_level: parseInt(stressLevel)
        },
        { onConflict: "user_id,log_date" }
      );

      if (error) throw error;

      alert("🎉 Log synchronized securely with Supabase!");
      navigate("/");
    } catch (err) {
      console.error("Submission error:", err.message);
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="log-container">
      {/* HEADER BAR */}
      <div className="log-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={22} />
        </button>
        <h2>Log Daily</h2>
        <button className="cal-btn" onClick={() => alert("Calendar coming soon!")}>
          <Calendar size={22} />
        </button>
      </div>

      {/* SLEEP CARD */}
      <div className="log-card">
        <div className="card-title sleep-title">
          <Moon size={18} />
          <span>Sleep</span>
        </div>
        <div className="slider-header">
          <span>Hours Slept</span>
          <div className="slider-val">
            {parseFloat(hoursSlept).toFixed(1)}
            <span>hours</span>
          </div>
        </div>
        <input
          type="range"
          className="range-slider"
          min="0"
          max="12"
          step="0.5"
          value={hoursSlept}
          onChange={(e) => setHoursSlept(e.target.value)}
        />
        <div className="slider-labels">
          <span>0</span><span>4</span><span>8</span><span>12</span>
        </div>
        <div className="sub-label">Sleep Quality</div>
        <div className="emoji-row">
          {QUALITY_EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              className={`emoji-btn ${sleepQuality === idx ? "active" : ""}`}
              onClick={() => setSleepQuality(idx)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* MEALS CARD */}
      <div className="log-card">
        <div className="card-title meals-title">
          <Utensils size={18} />
          <span>Meals</span>
        </div>
        <div className="meals-grid">
          <div className="meal-option">
            <span>Breakfast</span>
            <div className={`meal-checkbox ${breakfastEaten ? "checked" : ""}`} onClick={() => setBreakfastEaten(!breakfastEaten)}>
              <Check size={16} strokeWidth={3} />
            </div>
          </div>
          <div className="meal-option">
            <span>Lunch</span>
            <div className={`meal-checkbox ${lunchEaten ? "checked" : ""}`} onClick={() => setLunchEaten(!lunchEaten)}>
              <Check size={16} strokeWidth={3} />
            </div>
          </div>
          <div className="meal-option">
            <span>Dinner</span>
            <div className={`meal-checkbox ${dinnerEaten ? "checked" : ""}`} onClick={() => setDinnerEaten(!dinnerEaten)}>
              <Check size={16} strokeWidth={3} />
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVITY CARD */}
      <div className="log-card">
        <div className="card-title activity-title">
          <Activity size={18} />
          <span>Activity</span>
        </div>
        <div className="activity-row">
          <div className="input-box">
            <label>Steps</label>
            <div className="input-wrapper">
              <input type="number" value={steps} onChange={(e) => setSteps(e.target.value)} />
              <span className="unit">steps</span>
            </div>
          </div>
          <div className="input-box">
            <label>Sports / Exercise</label>
            <div className="input-wrapper">
              <select value={exerciseType} onChange={(e) => setExerciseType(e.target.value)}>
                <option value="Walking">Walking</option>
                <option value="Running">Running</option>
                <option value="Cycling">Cycling</option>
                <option value="Yoga">Yoga</option>
                <option value="Gym">Gym</option>
                <option value="None">None</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* STRESS CARD */}
      <div className="log-card">
        <div className="card-title stress-title">
          <Brain size={18} />
          <span>Stress Level</span>
        </div>
        <div className="slider-header">
          <span />
          <div className="slider-val" style={{ fontSize: "1.2rem" }}>
            {stressLevel} <span>/ 10</span>
          </div>
        </div>
        <div className="stress-gradient-bar">
          <input
            type="range"
            className="range-slider stress-slider"
            min="1"
            max="10"
            step="1"
            value={stressLevel}
            onChange={(e) => setStressLevel(e.target.value)}
          />
        </div>
        <div className="stress-labels">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <span key={num}>{num}</span>
          ))}
        </div>
      </div>

      <button className="save-btn" onClick={handleSaveData} disabled={submitting}>
        {submitting ? "Saving Log Entry..." : "Save Today's Data"}
      </button>
    </div>
  );
}
