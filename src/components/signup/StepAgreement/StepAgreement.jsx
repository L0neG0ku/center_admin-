import { useEffect, useRef, useState } from "react";
import Field from "../../ui/Field/Field.jsx";
import Checkbox from "../../ui/Checkbox/Checkbox.jsx";
import Icon from "../../../icons/Icon.jsx";
import FormSection from "../FormSection/FormSection.jsx";
import {
  acknowledgementLead,
  acknowledgementPoints,
  agreementDisclaimer,
  agreementMeta,
  agreementPreamble,
  agreementSections,
} from "../../../data/agreement.js";
import "./StepAgreement.css";

/** Step 4 from the sheet: read → acknowledge → sign → submit. */
export default function StepAgreement({ values, errors, set }) {
  const [readToEnd, setReadToEnd] = useState(false);
  const termsRef = useRef(null);

  useEffect(() => {
    const node = termsRef.current;
    if (!node) return undefined;

    const check = () => {
      if (node.scrollTop + node.clientHeight >= node.scrollHeight - 12) setReadToEnd(true);
    };

    check();
    node.addEventListener("scroll", check);
    return () => node.removeEventListener("scroll", check);
  }, []);

  return (
    <FormSection
      title="Agreement & Sign"
      description="Read the partner agreement, acknowledge it, sign, and submit your application."
    >
      <ol className="agreement__flow is-wide">
        {["Read the terms", "Acknowledge", "Digitally sign", "Submit"].map((label, index) => (
          <li key={label}>
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="is-wide">
        <div className="agreement__terms" ref={termsRef} tabIndex={0} role="region" aria-label="Kribble centre onboarding acknowledgement">
          <header className="agreement__header">
            <p className="agreement__eyebrow">{agreementMeta.version}</p>
            <h3>{agreementMeta.title}</h3>
            <p>{agreementMeta.operator}</p>
          </header>

          <div className="agreement__preamble">
            {agreementPreamble.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {agreementSections.map(({ heading, paragraphs }) => (
            <section className="agreement__section" key={heading}>
              <h4>{heading}</h4>
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}

          <section className="agreement__section agreement__confirmation">
            <h4>Confirmation</h4>
            <p>{acknowledgementLead}</p>
            <ol>
              {acknowledgementPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ol>
            <p className="agreement__disclaimer">{agreementDisclaimer}</p>
          </section>
        </div>

        <p className={`agreement__hint ${readToEnd ? "is-done" : ""}`.trim()}>
          <Icon name={readToEnd ? "checkCircle" : "chevronDown"} size={15} />
          {readToEnd ? "You've read the full agreement" : "Scroll to the end of the agreement to continue"}
        </p>
      </div>

      <div className="is-wide agreement__ack">
        <Checkbox checked={values.acknowledged} onChange={set("acknowledged")} disabled={!readToEnd}>
          I have read and accept the Kribble partner agreement, and I confirm the information
          submitted is accurate.
        </Checkbox>
        {errors.acknowledged ? (
          <span className="agreement__error" role="alert">
            {errors.acknowledged}
          </span>
        ) : null}
      </div>

      <div className="is-wide">
        <Field
          id="signature"
          label="Digital Signature"
          icon="pencil"
          required
          placeholder="Type your full name to sign"
          value={values.signature}
          onChange={set("signature")}
          error={errors.signature}
          hint="Typing your name here counts as your e-signature."
        />
      </div>
    </FormSection>
  );
}
