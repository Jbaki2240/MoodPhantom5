import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Ghost, Home, BarChart2, BookOpen, Heart, User, Settings, LogOut } from "lucide-react";
import "./sidebar.css";
//Navigation links to the files according to the buttons
const NAV_LINKS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/insights", label: "Insights", icon: BarChart2 },
  { to: "/log", label: "Log", icon: BookOpen },
  { to: "/health", label: "Health", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const close = () => setOpen(false);

  return (
    <>
      {/* TOP BAR */}
      <div className="topbar">
        <button className="menuBttn" onClick={() => setOpen(true)}>
          <Menu size={22} />
        </button>
        <span className="appName">
          <Ghost size={18} className="brand-icon" />
          MindPhantom
        </span>
      </div>

      {/* OVERLAY */}
      {open && <div className="overlay" onClick={close} />}

      {/* SIDEBAR PANEL */}
      <div className={`sidebar ${open ? "open" : ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-row">
              <Ghost size={32} className="brand-ghost" />
            </div>
            <span className="brand-name">MoodPhantom</span>
            <p className="brand-sub">Understand. Grow.</p>
          </div>
          <button className="close-btn" onClick={close}>
            <X size={20} />
          </button>
        </div>

        {/* Content Wrapper pushing items down sequentially */}
        <div className="sidebar-content">
          {/* Nav Links */}
          <nav className="nav">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={close}
                  className={`nav-link ${active ? "active" : ""}`}
                >
                  <Icon size={18} className="nav-icon" />
                  {label}
                </Link>
              );
            })}

            {/* Logout button placed immediately after Settings inside the nav list */}
            <button className="logout-btn" onClick={close}>
              <LogOut size={18} className="nav-icon" />
              Logout
            </button>
          </nav>

          {/* Daily Mantra Card at the absolute bottom */}
          <div className="mood-card">
            <div className="mood-illustration">
              <div className="meditation-bg" />
            </div>
            <p className="mood-text">
              Take small steps everyday <br />
              toward a better tomorrow.
            </p>
            <div className="card-footer-heart">
              <Heart size={18} className="footer-heart" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
