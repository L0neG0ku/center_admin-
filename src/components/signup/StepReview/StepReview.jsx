import FormSection from "../FormSection/FormSection.jsx";
import { documentsFor } from "../../../data/signup.js";
import "./StepReview.css";

function Row({ label, value }) {
  return (
    <div className="review__row">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

export default function StepReview({ values, onEdit }) {
  const documents = documentsFor(values).filter((doc) => !doc.disabled);
  const uploaded = documents.filter((doc) => values.files[doc.id]).length;
  const photoCount = Object.values(values.photos).reduce((sum, list) => sum + list.length, 0);

  return (
    <FormSection
      title="Review"
      description="A quick check before you sign. Jump back to any step to change something."
    >
      <div className="is-wide review__grid">
        <section className="review__block">
          <header>
            <h4>Name &amp; Type</h4>
            <button type="button" onClick={() => onEdit(0)}>
              Edit
            </button>
          </header>
          <Row label="Legal name" value={values.legalName} />
          <Row label="Display name" value={values.displayName} />
          <Row label="Type" value={values.centreType} />
          <Row
            label="Ownership"
            value={
              values.ownership === "Franchise"
                ? `Franchise — ${values.franchiseBrand}`
                : values.ownership
            }
          />
        </section>

        <section className="review__block">
          <header>
            <h4>Location &amp; Contact</h4>
            <button type="button" onClick={() => onEdit(0)}>
              Edit
            </button>
          </header>
          <Row label="Address" value={values.address} />
          <Row
            label="City"
            value={[values.city, values.state, values.pincode].filter(Boolean).join(", ")}
          />
          <Row label="Owner" value={values.ownerName} />
          <Row label="Mobile" value={`${values.phone}${values.phoneVerified ? " · verified" : ""}`} />
          <Row label="Email" value={values.email} />
        </section>

        <section className="review__block">
          <header>
            <h4>Timings &amp; Capacity</h4>
            <button type="button" onClick={() => onEdit(0)}>
              Edit
            </button>
          </header>
          <Row label="Open" value={values.workingDays.join(", ")} />
          <Row label="Hours" value={`${values.openTime} – ${values.closeTime}`} />
          {values.preschoolSlots ? <Row label="Preschool" value={values.preschoolSlots} /> : null}
          <Row label="Age groups" value={values.ageGroups.join(", ")} />
          <Row label="Capacity" value={values.capacity ? `${values.capacity} seats` : ""} />
          <Row label="Facilities" value={`Meals: ${values.meals} · CCTV: ${values.cctv}`} />
        </section>

        <section className="review__block">
          <header>
            <h4>Fees</h4>
            <button type="button" onClick={() => onEdit(0)}>
              Edit
            </button>
          </header>
          <Row label="Full-day" value={values.feeFullDay ? `₹${values.feeFullDay} / month` : ""} />
          <Row label="Half-day" value={values.feeHalfDay ? `₹${values.feeHalfDay} / month` : ""} />
          {values.feeAdmission ? <Row label="Admission" value={`₹${values.feeAdmission}`} /> : null}
        </section>

        <section className="review__block">
          <header>
            <h4>Documents</h4>
            <button type="button" onClick={() => onEdit(1)}>
              Edit
            </button>
          </header>
          <Row label="Uploaded" value={`${uploaded} of ${documents.length}`} />
          <Row label="Business proof" value={values.businessProofType} />
          <Row label="Bank account" value={values.bankAccountName} />
          <Row
            label="Account"
            value={
              values.bankAccountNumber
                ? `•••• ${values.bankAccountNumber.slice(-4)} · ${values.bankIfsc}`
                : ""
            }
          />
        </section>

        <section className="review__block">
          <header>
            <h4>Photos</h4>
            <button type="button" onClick={() => onEdit(2)}>
              Edit
            </button>
          </header>
          <Row label="Added" value={`${photoCount} photo${photoCount === 1 ? "" : "s"}`} />
        </section>
      </div>
    </FormSection>
  );
}
