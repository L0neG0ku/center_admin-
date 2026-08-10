import BrandPanel from "../BrandPanel/BrandPanel.jsx";
import "./AuthShell.css";

/**
 * Two-column card used by /signup and /login: brand panel on the left,
 * whatever the page needs on the right.
 */
export default function AuthShell({ brand, children, below, footer, wide = false }) {
  return (
    <div className="auth">
      <div className={`auth__inner ${wide ? "auth__inner--wide" : ""}`.trim()}>
        <div className="auth__card">
          <BrandPanel {...brand} />
          <div className="auth__content">{children}</div>
        </div>

        {below}

        {footer ? <p className="auth__footer">{footer}</p> : null}
      </div>
    </div>
  );
}
