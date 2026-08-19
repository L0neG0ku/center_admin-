import { Link, NavLink } from "react-router-dom";
import Icon from "../../icons/Icon.jsx";
import { Avatar } from "./ui.jsx";
import { navGroups } from "./nav.js";
import logo from "../../assets/logo-purple.png";

export default function Sidebar({ mini, onToggleMini, onNavigate, user }) {
  return (
    <aside className="dside">
      <Link to="/dashboard" className="dside__brand" aria-label="Kribble dashboard">
        {/* The logo already reads "kribble", so no wordmark beside it. */}
        <span className="dside__mark">
          <img src={logo} alt="Kribble" />
        </span>
      </Link>

      <button
        type="button"
        className="dside__handle"
        onClick={onToggleMini}
        aria-label={mini ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Icon name={mini ? "chevronRight" : "chevronLeft"} size={15} />
      </button>

      <nav className="dside__nav" aria-label="Dashboard">
        {navGroups.map((group) => (
          <div key={group.id}>
            <p className="dside__group">{group.label}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) => `dside__link ${isActive ? "is-active" : ""}`.trim()}
                onClick={onNavigate}
                data-count={item.count ? "1" : undefined}
                title={mini ? item.label : undefined}
              >
                <Icon name={item.icon} size={19} />
                <span className="dside__label">{item.label}</span>
                {item.count ? <span className="dside__count">{item.count}</span> : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="dside__foot">
        <div className="dside__help">
          <span className="dside__help-icon">
            <Icon name="headset" size={19} />
          </span>
          <strong>Need help?</strong>
          <p>Your Kribble partner manager is one message away.</p>
          <Link to="/dashboard/support" onClick={onNavigate}>
            Get support
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>

        <button type="button" className="dside__me">
          <Avatar name={user.name} size={34} />
          <span className="dside__me-text">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </span>
          <Icon name="more" size={16} className="muted" />
        </button>
      </div>
    </aside>
  );
}
