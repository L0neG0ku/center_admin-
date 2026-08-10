import "./FormSection.css";

/** A titled block of fields inside a step. */
export default function FormSection({ title, description, children, className = "" }) {
  return (
    <section className={`form-section ${className}`.trim()}>
      <header>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </header>
      <div className="form-section__body">{children}</div>
    </section>
  );
}
