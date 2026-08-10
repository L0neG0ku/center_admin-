import { useState } from "react";
import Icon from "../../../icons/Icon.jsx";
import "./Field.css";

/**
 * One form control with a label, an optional leading icon and inline error.
 * type: text | email | tel | number | date | password | select | textarea
 */
export default function Field({
  id,
  label,
  type = "text",
  icon,
  value,
  onChange,
  options = [],
  placeholder,
  required = false,
  error,
  hint,
  rows = 3,
  min,
  suffix,
}) {
  const [reveal, setReveal] = useState(false);
  const describedBy = error ? `${id}-error` : undefined;
  const inputType = type === "password" && reveal ? "text" : type;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>

      <div className={`field__control ${error ? "has-error" : ""} ${type === "textarea" ? "is-textarea" : ""}`.trim()}>
        {icon ? <Icon name={icon} size={17} className="field__icon" /> : null}

        {type === "select" ? (
          <>
            <select
              id={id}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy}
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Icon name="chevronDown" size={16} className="field__chevron" />
          </>
        ) : type === "textarea" ? (
          <textarea
            id={id}
            rows={rows}
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
          />
        ) : (
          <input
            id={id}
            type={inputType}
            value={value}
            placeholder={placeholder}
            min={min}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
          />
        )}

        {type === "password" ? (
          <button
            type="button"
            className="field__peek"
            onClick={() => setReveal((value) => !value)}
            aria-label={reveal ? "Hide password" : "Show password"}
          >
            <Icon name={reveal ? "eyeOff" : "eye"} size={17} />
          </button>
        ) : null}

        {suffix}
      </div>

      {error ? (
        <span className="field__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  );
}
