import Icon from "../../../icons/Icon.jsx";
import "./Checkbox.css";

export default function Checkbox({ checked = false, onChange, children, disabled = false }) {
  return (
    <label className={`checkbox ${disabled ? "is-disabled" : ""}`.trim()}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className="checkbox__box">
        <Icon name="check" size={12} strokeWidth={3} />
      </span>
      {children ? <span className="checkbox__text">{children}</span> : null}
    </label>
  );
}
