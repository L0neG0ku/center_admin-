import Field from "../../ui/Field/Field.jsx";
import FileDrop from "../../ui/FileDrop/FileDrop.jsx";
import Checkbox from "../../ui/Checkbox/Checkbox.jsx";
import Icon from "../../../icons/Icon.jsx";
import FormSection from "../FormSection/FormSection.jsx";
import { businessProofTypes, documentsFor } from "../../../data/signup.js";
import "./StepDocuments.css";

export default function StepDocuments({ values, errors, set, setFile }) {
  const documents = documentsFor(values);

  return (
    <>
      <FormSection
        title="Documents"
        description="Only the basics needed to onboard. Staff background checks aren't asked for here — Kribble runs those itself."
      >
        <ul className="docs is-wide">
          {documents.map((doc) => (
            <li key={doc.id} className={doc.disabled ? "is-disabled" : ""}>
              <header>
                <div>
                  <h4>
                    {doc.label}
                    {doc.required ? <span className="docs__req">Required</span> : <span>Optional</span>}
                  </h4>
                  <p>{doc.note}</p>
                </div>
              </header>

              {doc.id === "gst" ? (
                <div className="docs__exempt">
                  <Checkbox checked={values.gstExempt} onChange={set("gstExempt")}>
                    This centre is GST-exempt — skip the GST certificate
                  </Checkbox>
                </div>
              ) : null}

              {doc.withPicker ? (
                <Field
                  id="businessProofType"
                  label="Which proof are you uploading?"
                  type="select"
                  options={businessProofTypes}
                  required
                  placeholder="Select a document type"
                  value={values.businessProofType}
                  onChange={set("businessProofType")}
                  error={errors.businessProofType}
                />
              ) : null}

              {doc.disabled ? (
                <p className="docs__skipped">
                  <Icon name="checkCircle" size={15} />
                  Skipped — marked GST-exempt in the previous step.
                </p>
              ) : (
                <FileDrop
                  id={`doc-${doc.id}`}
                  file={values.files[doc.id]}
                  onSelect={(file) => setFile(doc.id, file)}
                  onRemove={() => setFile(doc.id, null)}
                  error={errors[`file_${doc.id}`]}
                />
              )}

              {errors[`file_${doc.id}`] ? (
                <span className="docs__error" role="alert">
                  {errors[`file_${doc.id}`]}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </FormSection>

      <FormSection
        title="Bank Details"
        description="Parent payments are settled here. We'll send ₹1 to confirm the account and match the name."
      >
        <div className="is-wide">
          <Field
            id="bankAccountName"
            label="Account Holder Name"
            icon="bank"
            required
            placeholder="Exactly as it appears on the account"
            value={values.bankAccountName}
            onChange={set("bankAccountName")}
            error={errors.bankAccountName}
          />
        </div>

        <Field
          id="bankAccountNumber"
          label="Account Number"
          icon="bank"
          required
          placeholder="Enter account number"
          value={values.bankAccountNumber}
          onChange={set("bankAccountNumber")}
          error={errors.bankAccountNumber}
        />
        <Field
          id="bankIfsc"
          label="IFSC Code"
          icon="bank"
          required
          placeholder="e.g. HDFC0001234"
          value={values.bankIfsc}
          onChange={set("bankIfsc")}
          error={errors.bankIfsc}
        />

        <p className="docs__penny is-wide">
          <Icon name="shieldCheck" size={16} />
          We'll deposit ₹1 into this account during verification and check that the name matches.
        </p>
      </FormSection>
    </>
  );
}
