import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Moon, Footprints, Brain, Utensils, Lightbulb, Plus, Activity,
  Home as HomeIcon, BarChart2, Heart, User,
} from "lucide-react";
import { loadDailyLog } from "./dailyLogs";
import DailyLogError from "./DailyLogError";
import { formatSleep, getLocalDate, getLogInsight, getMealsCount } from "./dailyLogData";
import "./home.css";

export default function Home({ user }) {
  const location = useLocation();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await loadDailyLog(getLocalDate());
        if (active) setLog(data);
      } catch (err) {
        if (active) {
          setLog(null);
          setError(err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    const reload = () => setRefresh((value) => value + 1);
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.user_metadata?.first_name;
  const meals = log ? getMealsCount(log) : 0;
  const stress = log?.stress_level;
  const stressLabel = stress == null ? "Today" : stress <= 3 ? "Low" : stress <= 6 ? "Moderate" : "High";
  const placeholder = loading ? "Loading…" : "Not logged";
  const cards = [
    { className: "sleep", icon: Moon, title: "Sleep", value: log?.hours_slept != null ? formatSleep(log.hours_slept) : placeholder, caption: "Last night's sleep", progress: Number(log?.hours_slept ?? 0) / 8 * 100 },
    { className: "steps", icon: Footprints, title: "Steps", value: log?.steps != null ? Number(log.steps).toLocaleString() : placeholder, caption: "Today", progress: Number(log?.steps ?? 0) / 10000 * 100 },
    { className: "stress", icon: Brain, title: "Stress", value: stress != null ? `${stress} / 10` : placeholder, caption: stressLabel, progress: Number(stress ?? 0) * 10 },
    { className: "meals", icon: Utensils, title: "Meals", value: log ? `${meals} / 3` : placeholder, caption: "Logged today", progress: meals / 3 * 100 },
  ];

  return (
    <div className="home-container" aria-busy={loading}>
      <div className="home-header">
        <h2>{greeting}{firstName ? `, ${firstName}` : ""} 👋</h2>
        <p>{loading ? "Loading your daily summary…" : error ? "Your daily summary is unavailable." : log ? "Here's your saved daily summary." : "Log your day to start tracking your patterns."}</p>
      </div>
      {location.state?.savedDate && <p className="home-message" role="status">Your log for {location.state.savedDate} was saved.</p>}
      {error && (
        <DailyLogError error={error} onRetry={() => setRefresh((value) => value + 1)} retrying={loading} />
      )}
      <div className="stats-grid">
        {cards.map(({ className, icon: Icon, title, value, caption, progress }) => (
          <div className={`card ${className}`} key={title}>
            <Icon size={18} aria-hidden="true" />
            <div>
              <h3>{title}</h3>
              <p>{loading ? placeholder : error ? "Unavailable" : value}</p>
              <span>{caption}</span>
              <div className="bar" aria-hidden="true">
                <div style={{ width: `${loading || error ? 0 : Math.min(100, Math.max(0, progress))}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="insight-card">
        <Lightbulb className="bulb" size={20} aria-hidden="true" />
        <div>
          <h4>Today's Summary</h4>
          <p>{loading ? "Loading your saved data…" : error ? "Try again to see your summary." : getLogInsight(log)}</p>
        </div>
      </div>
      <div className="section-title">Quick Actions</div>
      <div className="quick-actions">
        <Link to="/log#meals"><Utensils size={18} />Log Meal</Link>
        <Link to="/log#sleep"><Moon size={18} />Log Sleep</Link>
        <Link to="/log#activity"><Activity size={18} />Add Activity</Link>
      </div>
      <nav className="bottom-nav" aria-label="Main navigation">
        <Link to="/" className="active" aria-label="Home" aria-current="page"><HomeIcon size={18} /></Link>
        <Link to="/insights" aria-label="Insights"><BarChart2 size={18} /></Link>
        <Link to="/log" className="plus" aria-label="Log your day"><Plus size={22} /></Link>
        <Link to="/health" aria-label="Health"><Heart size={18} /></Link>
        <Link to="/profile" aria-label="Profile"><User size={18} /></Link>
      </nav>
    </div>
  );
}
