

import "./home.css";
import {
  Moon,
  Footprints,
  Brain,
  Utensils,
  Lightbulb,
  Plus,
  Activity,
  Home as HomeIcon,
  BarChart2,
  Heart,
  User,
} from "lucide-react";

export default function Home() {
  return (
    <div className="home-container">

      {/* HEADER */}
      <div className="home-header">
        <h2>Good evening, Jannatul 👋</h2>
        <p>You're doing okay today.</p>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid">

        <div className="card sleep">
          <Moon size={18} />
          <div>
            <h3>Sleep</h3>
            <p>6h 20m</p>
            <span>Last night</span>
            <div className="bar">
              <div style={{ width: "65%" }}></div>
            </div>
          </div>
        </div>

        <div className="card steps">
          <Footprints size={18} />
          <div>
            <h3>Steps</h3>
            <p>4,200</p>
            <span>Today</span>
            <div className="bar">
              <div style={{ width: "50%" }}></div>
            </div>
          </div>
        </div>

        <div className="card stress">
          <Brain size={18} />
          <div>
            <h3>Stress</h3>
            <p>7 / 10</p>
            <span>High</span>
            <div className="bar">
              <div style={{ width: "70%" }}></div>
            </div>
          </div>
        </div>

        <div className="card meals">
          <Utensils size={18} />
          <div>
            <h3>Meals</h3>
            <p>2 / 3</p>
            <span>Logged today</span>
            <div className="bar">
              <div style={{ width: "40%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* INSIGHT */}
      <div className="insight-card">
        <Lightbulb className="bulb" size={20} />
        <div>
          <h4>Today's Insight</h4>
          <p>Your sleep has been below 7 hours for 3 days.</p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="section-title">Quick Actions</div>

      <div className="quick-actions">
        <button>
          <Utensils size={18} />
          Log Meal
        </button>

        <button>
          <Moon size={18} />
          Log Sleep
        </button>

        <button>
          <Activity size={18} />
          Add Activity
        </button>
      </div>

      {/* BOTTOM NAV (visual only if needed) */}
      <div className="bottom-nav">
        <div className="active"><HomeIcon size={18} /></div>
        <div><BarChart2 size={18} /></div>
        <div className="plus"><Plus size={22} /></div>
        <div><Heart size={18} /></div>
        <div><User size={18} /></div>
      </div>

    </div>
  );
}