import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Icon from "../../../icons/Icon.jsx";
import Button from "../../ui/Button/Button.jsx";
import logo from "../../../assets/logo.png";
import { navLinks } from "../../../data/navigation.js";
import "./SiteHeader.css";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link to="/" className="site-header__brand" aria-label="Kribble home">
          <img src={logo} alt="Kribble" />
        </Link>

        <nav className={`site-header__nav ${open ? "is-open" : ""}`.trim()} aria-label="Main">
          <ul>
            {navLinks.map((link) => (
              <li key={link.id}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) => (isActive ? "is-active" : "")}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="site-header__mobile-actions">
            <Button to="/login" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Log In
            </Button>
            <Button to="/signup" size="sm" onClick={() => setOpen(false)}>
              Sign Up
            </Button>
          </div>
        </nav>

        <div className="site-header__actions">
          <Button to="/login" variant="outline" size="sm">
            Log In
          </Button>
          <Button to="/signup" size="sm">
            Sign Up
          </Button>
        </div>

        <button
          type="button"
          className="site-header__toggle"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <Icon name={open ? "close" : "menu"} size={22} />
        </button>
      </div>
    </header>
  );
}
