import Icon from "../../icons/Icon.jsx";
import { Sparkline } from "./Charts.jsx";

/* ------------------------------------------------------------------
   Small building blocks shared by every dashboard page.
   Styling lives in styles/dash-ui.css.
   ------------------------------------------------------------------ */

export function PageHead({ title, sub, children }) {
  return (
    <header className="phead">
      <div className="phead__text">
        <h1>{title}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
      {children ? <div className="phead__actions">{children}</div> : null}
    </header>
  );
}

export function Panel({ title, sub, badge, action, tools, children, flush = false, className = "" }) {
  return (
    <section className={`panel ${className}`.trim()}>
      {title || tools || action ? (
        <header className="panel__head">
          <div className="panel__title">
            <div>
              <h2>{title}</h2>
              {sub ? <p>{sub}</p> : null}
            </div>
            {badge ? <Tag tone={badge.tone}>{badge.label}</Tag> : null}
          </div>
          {tools || action ? (
            <div className="panel__tools">
              {tools}
              {action ? (
                <button type="button" className="panel__link" onClick={action.onClick}>
                  {action.label}
                  <Icon name="arrowRight" size={15} />
                </button>
              ) : null}
            </div>
          ) : null}
        </header>
      ) : null}
      <div className={flush ? "panel__body panel__body--flush" : "panel__body"}>{children}</div>
    </section>
  );
}

export function Tag({ tone = "grey", dot = false, children }) {
  return <span className={`tag tone-${tone} ${dot ? "tag--dot" : ""}`.trim()}>{children}</span>;
}

const AVATAR_TONES = [
  ["#8b5cf6", "#6d28d9"],
  ["#ec4899", "#be185d"],
  ["#3b82f6", "#1d4ed8"],
  ["#16a34a", "#15803d"],
  ["#f59e0b", "#b45309"],
  ["#06b6d4", "#0e7490"],
];

/** Initials avatar. Colour is derived from the name so it stays stable. */
export function Avatar({ name = "", size = 38, square = false, src }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const [from, to] = AVATAR_TONES[seed % AVATAR_TONES.length];

  return (
    <span
      className={`avatar ${square ? "avatar--square" : ""}`.trim()}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.37),
        background: src ? "none" : `linear-gradient(145deg, ${from}, ${to})`,
      }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" /> : initials}
    </span>
  );
}

/** Avatar + name + secondary line — the standard first cell of a table. */
export function Who({ name, sub, src, icon, tone = "brand", size = 38 }) {
  return (
    <div className="who">
      {icon ? (
        <span className={`avatar avatar--square tone-${tone}`} style={{ width: size, height: size }}>
          <Icon name={icon} size={Math.round(size * 0.5)} />
        </span>
      ) : (
        <Avatar name={name} src={src} size={size} />
      )}
      <span className="who__text">
        <strong>{name}</strong>
        {sub ? <span>{sub}</span> : null}
      </span>
    </div>
  );
}

export function StatCard({ icon, tone = "brand", label, value, delta, series }) {
  const colour = {
    brand: "#7c3aed",
    green: "#16a34a",
    amber: "#f59e0b",
    blue: "#3b82f6",
    red: "#ef4444",
    pink: "#ec4899",
  }[tone];

  return (
    <article className="stat">
      <span className={`stat__icon tone-${tone}`}>
        <Icon name={icon} size={21} />
      </span>
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      {delta ? (
        <p className={`stat__delta stat__delta--${delta.dir}`}>
          <Icon
            name={delta.dir === "up" ? "arrowUp" : delta.dir === "down" ? "arrowDown" : "minusCircle"}
            size={14}
          />
          {delta.text}
        </p>
      ) : null}
      {series ? <Sparkline points={series} color={colour} className="stat__spark" /> : null}
    </article>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="dtabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={value === tab.id ? "is-on" : ""}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined ? ` (${tab.count})` : ""}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon = "search", title, body, action }) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={icon} size={24} />
      </span>
      <strong>{title}</strong>
      {body ? <p>{body}</p> : null}
      {action}
    </div>
  );
}

export function Switch({ on, onChange, title, body }) {
  return (
    <div className="dswitch">
      <span className="dswitch__text">
        <strong>{title}</strong>
        {body ? <span>{body}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        className={`dswitch__track ${on ? "is-on" : ""}`.trim()}
        onClick={() => onChange(!on)}
      >
        <span className="dswitch__knob" />
      </button>
    </div>
  );
}

export function Fact({ label, value }) {
  return (
    <div className="dfact">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

export function Row({ label, value }) {
  return (
    <div className="drow">
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
    </div>
  );
}

export function Search({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="tsearch">
      <Icon name="search" size={17} />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="tselect">
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" size={15} />
    </div>
  );
}

export function Reset({ onClick }) {
  return (
    <button type="button" className="treset" onClick={onClick}>
      <Icon name="refresh" size={15} />
      Reset
    </button>
  );
}

/** Button that isn't a router link — the dashboard uses these everywhere. */
export function Btn({ variant = "primary", size, icon, children, className = "", ...rest }) {
  return (
    <button
      type="button"
      className={`dbtn dbtn--${variant} ${size === "sm" ? "dbtn--sm" : ""} ${className}`.trim()}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 15 : 17} /> : null}
      {children}
    </button>
  );
}

export function IconBtn({ icon, label, ...rest }) {
  return (
    <button type="button" className="dicon-btn" aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={17} />
    </button>
  );
}
