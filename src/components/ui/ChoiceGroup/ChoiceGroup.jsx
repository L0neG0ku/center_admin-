import "./ChoiceGroup.css";

/** Segmented radio buttons — used for Daycare/Preschool/Both, Yes/No, etc. */
export default function ChoiceGroup({ label, name, options, value, onChange, required = false, error, hint }) {
  return (
    <fieldset className="choice">
      <legend className="choice__label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </legend>

      <div className={`choice__options ${error ? "has-error" : ""}`.trim()}>
        {options.map((option) => (
          <label key={option} className={`choice__option ${value === option ? "is-active" : ""}`.trim()}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            {option}
          </label>
        ))}
      </div>

      {error ? (
        <span className="choice__error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="choice__hint">{hint}</span>
      ) : null}
    </fieldset>
  );
}
