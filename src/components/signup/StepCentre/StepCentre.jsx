import Field from "../../ui/Field/Field.jsx";
import Button from "../../ui/Button/Button.jsx";
import ChoiceGroup from "../../ui/ChoiceGroup/ChoiceGroup.jsx";
import Icon from "../../../icons/Icon.jsx";
import FormSection from "../FormSection/FormSection.jsx";
import {
  ageGroups,
  centreTypes,
  curriculumOptions,
  daycareRatios,
  indianStates,
  ownershipTypes,
  preschoolRatios,
  preschoolSlotOptions,
  primaryLanguages,
  weekdays,
  yesNo,
} from "../../../data/signup.js";
import "./StepCentre.css";

export default function StepCentre({
  values,
  errors,
  set,
  toggleIn,
  otp,
  onOtp,
  verificationRequired = true,
}) {
  const hasPreschool = values.centreType === "Preschool" || values.centreType === "Both";
  const hasDaycare = values.centreType === "Daycare" || values.centreType === "Both";

  return (
    <>
      <FormSection title="Name & Type" description="What parents will see, and what the licence says.">
        <Field
          id="legalName"
          label="Legal Centre Name"
          icon="building"
          required
          placeholder="As printed on your registration"
          value={values.legalName}
          onChange={set("legalName")}
          error={errors.legalName}
        />
        <Field
          id="displayName"
          label="Display Name"
          icon="building"
          required
          placeholder="The name parents will see"
          value={values.displayName}
          onChange={set("displayName")}
          error={errors.displayName}
        />

        <div className="is-wide">
          <ChoiceGroup
            label="Centre Type"
            name="centreType"
            options={centreTypes}
            value={values.centreType}
            onChange={set("centreType")}
            required
            error={errors.centreType}
            hint="This decides which questions and documents you'll see next."
          />
        </div>
      </FormSection>

      <FormSection title="Location" description="Where is your centre?">
        <div className="is-wide">
          <Field
            id="address"
            label="Complete Address"
            icon="mapPin"
            required
            placeholder="Building, street, landmark"
            value={values.address}
            onChange={set("address")}
            error={errors.address}
          />
        </div>

        <Field
          id="area"
          label="Area / Locality"
          icon="mapPin"
          placeholder="e.g. Koramangala"
          value={values.area}
          onChange={set("area")}
        />
        <Field
          id="city"
          label="City"
          icon="mapPin"
          required
          placeholder="Enter your city"
          value={values.city}
          onChange={set("city")}
          error={errors.city}
        />
        <Field
          id="state"
          label="State"
          type="select"
          options={indianStates}
          required
          placeholder="Select your state"
          value={values.state}
          onChange={set("state")}
          error={errors.state}
        />
        <Field
          id="pincode"
          label="Pincode"
          icon="mapPin"
          required
          placeholder="6-digit pincode"
          value={values.pincode}
          onChange={set("pincode")}
          error={errors.pincode}
        />

        <div className="is-wide">
          <Field
            id="mapPin"
            label="Map Pin"
            icon="mapPin"
            placeholder="Paste a Google Maps link, or coordinates"
            value={values.mapPin}
            onChange={set("mapPin")}
            hint="Helps parents find the exact entrance. You can also set this on our call."
          />
        </div>
      </FormSection>

      <FormSection title="Contact" description="Who should we speak to about this centre?">
        <Field
          id="ownerName"
          label="Owner Name"
          icon="user"
          required
          placeholder="Enter the owner's full name"
          value={values.ownerName}
          onChange={set("ownerName")}
          error={errors.ownerName}
        />

        <Field
          id="email"
          label="Email Address"
          type="email"
          icon="mail"
          required
          placeholder="you@example.com"
          value={values.email}
          onChange={set("email")}
          error={errors.email}
        />

        <div className="is-wide centre__contact">
          <Field
            id="phone"
            label="Owner Mobile Number"
            type="tel"
            icon="phone"
            required
            placeholder="+91 98765 43210"
            value={values.phone}
            onChange={(value) => {
              set("phone")(value);
              onOtp.reset();
            }}
            error={errors.phone}
            hint={
              values.phoneVerified
                ? undefined
                : verificationRequired
                  ? "We'll send a one-time code to confirm this number."
                  : "Optional for now — you can verify this number with a code, or carry on."
            }
            suffix={
              values.phoneVerified ? (
                <span className="centre__verified">
                  <Icon name="checkCircle" size={16} />
                  Verified
                </span>
              ) : (
                <button type="button" className="centre__send" onClick={onOtp.send}>
                  {otp.sent ? "Resend" : "Send code"}
                </button>
              )
            }
          />

          {otp.sent && !values.phoneVerified ? (
            <div className="centre__otp">
              <Field
                id="otp"
                label="Enter the 6-digit code"
                icon="key"
                placeholder="000000"
                value={otp.code}
                onChange={onOtp.setCode}
                error={otp.error}
                hint={
                  otp.prefilled
                    ? "Test code filled in for you — edit it if you want."
                    : "Enter the code we texted you."
                }
              />
              <Button variant="outline" onClick={onOtp.verify}>
                Verify
              </Button>
            </div>
          ) : null}
        </div>
      </FormSection>

      <FormSection title="Timings" description="When are you open?">
        <div className="is-wide">
          <span className="centre__label">
            Working Days<span aria-hidden="true"> *</span>
          </span>
          <div className={`centre__days ${errors.workingDays ? "has-error" : ""}`.trim()}>
            {weekdays.map((day) => (
              <button
                key={day}
                type="button"
                className={values.workingDays.includes(day) ? "is-on" : ""}
                onClick={() => toggleIn("workingDays", day)}
              >
                {day}
              </button>
            ))}
          </div>
          {errors.workingDays ? (
            <span className="centre__error" role="alert">
              {errors.workingDays}
            </span>
          ) : null}
        </div>

        <Field
          id="openTime"
          label="Opens At"
          type="time"
          required
          value={values.openTime}
          onChange={set("openTime")}
          error={errors.openTime}
        />
        <Field
          id="closeTime"
          label="Closes At"
          type="time"
          required
          value={values.closeTime}
          onChange={set("closeTime")}
          error={errors.closeTime}
        />

        {hasPreschool ? (
          <div className="is-wide">
            <ChoiceGroup
              label="Preschool Shifts"
              name="preschoolSlots"
              options={preschoolSlotOptions}
              value={values.preschoolSlots}
              onChange={set("preschoolSlots")}
              required
              error={errors.preschoolSlots}
              hint="Two shifts usually means a morning and an afternoon batch."
            />
          </div>
        ) : null}
      </FormSection>

      <FormSection title="Programs & Capacity" description="Who do you look after, and how many?">
        <div className="is-wide">
          <span className="centre__label">
            Age Groups / Programs<span aria-hidden="true"> *</span>
          </span>
          <div className={`centre__chips ${errors.ageGroups ? "has-error" : ""}`.trim()}>
            {ageGroups.map((group) => (
              <button
                key={group}
                type="button"
                className={values.ageGroups.includes(group) ? "is-on" : ""}
                onClick={() => toggleIn("ageGroups", group)}
              >
                {group}
              </button>
            ))}
          </div>
          {errors.ageGroups ? (
            <span className="centre__error" role="alert">
              {errors.ageGroups}
            </span>
          ) : null}
        </div>

        <Field
          id="capacity"
          label="Total Capacity (seats)"
          type="number"
          icon="users"
          min="1"
          required
          placeholder="e.g. 60"
          value={values.capacity}
          onChange={set("capacity")}
          error={errors.capacity}
        />
      </FormSection>

      {values.centreType ? (
        <FormSection
          title="Curriculum & Approach"
          description="How you teach and care — this helps parents find the right fit."
        >
          {hasPreschool ? (
            <div className="is-wide">
              <span className="centre__label">
                Curriculum Followed<span aria-hidden="true"> *</span>
              </span>
              <div className={`centre__chips ${errors.curriculum ? "has-error" : ""}`.trim()}>
                {curriculumOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={values.curriculum.includes(option) ? "is-on" : ""}
                    onClick={() => toggleIn("curriculum", option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {errors.curriculum ? (
                <span className="centre__error" role="alert">
                  {errors.curriculum}
                </span>
              ) : null}

              {values.curriculum.includes("Other") ? (
                <div className="centre__other">
                  <Field
                    id="curriculumOther"
                    label="Tell us about your curriculum"
                    required
                    placeholder="Describe your approach"
                    value={values.curriculumOther}
                    onChange={set("curriculumOther")}
                    error={errors.curriculumOther}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="is-wide">
            <span className="centre__label">
              Primary Language Used<span aria-hidden="true"> *</span>
            </span>
            <div className={`centre__chips ${errors.languages ? "has-error" : ""}`.trim()}>
              {primaryLanguages.map((language) => (
                <button
                  key={language}
                  type="button"
                  className={values.languages.includes(language) ? "is-on" : ""}
                  onClick={() => toggleIn("languages", language)}
                >
                  {language}
                </button>
              ))}
            </div>
            {errors.languages ? (
              <span className="centre__error" role="alert">
                {errors.languages}
              </span>
            ) : null}

            {values.languages.includes("Others") ? (
              <div className="centre__other">
                <Field
                  id="languageOther"
                  label="Which language?"
                  required
                  placeholder="e.g. Kannada, Tamil, Marathi"
                  value={values.languageOther}
                  onChange={set("languageOther")}
                  error={errors.languageOther}
                />
              </div>
            ) : null}
          </div>

          {hasPreschool ? (
            <div className="is-wide">
              <ChoiceGroup
                label="Teacher-to-Child Ratio — Preschool"
                name="preschoolRatio"
                options={preschoolRatios}
                value={values.preschoolRatio}
                onChange={set("preschoolRatio")}
                error={errors.preschoolRatio}
                hint="Optional — you can confirm this on our call."
              />
              {values.preschoolRatio === "Other" ? (
                <div className="centre__ratio-other">
                  <span className="centre__ratio-prefix">1:</span>
                  <Field
                    id="preschoolRatioOther"
                    label=""
                    type="number"
                    min="1"
                    placeholder="e.g. 18"
                    value={values.preschoolRatioOther}
                    onChange={set("preschoolRatioOther")}
                    error={errors.preschoolRatioOther}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {hasDaycare ? (
            <div className="is-wide">
              <ChoiceGroup
                label="Caregiver-to-Child Ratio — Daycare"
                name="daycareRatio"
                options={daycareRatios}
                value={values.daycareRatio}
                onChange={set("daycareRatio")}
                error={errors.daycareRatio}
                hint="Optional — you can confirm this on our call."
              />
              {values.daycareRatio === "Other" ? (
                <div className="centre__ratio-other">
                  <span className="centre__ratio-prefix">1:</span>
                  <Field
                    id="daycareRatioOther"
                    label=""
                    type="number"
                    min="1"
                    placeholder="e.g. 3"
                    value={values.daycareRatioOther}
                    onChange={set("daycareRatioOther")}
                    error={errors.daycareRatioOther}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </FormSection>
      ) : null}

      <FormSection title="Facilities" description="A couple of quick yes-or-no questions.">
        <ChoiceGroup
          label="Are meals served at the centre?"
          name="meals"
          options={yesNo}
          value={values.meals}
          onChange={set("meals")}
          required
          error={errors.meals}
          hint="Choosing Yes adds an FSSAI licence to your document list."
        />
        <ChoiceGroup
          label="Is CCTV installed?"
          name="cctv"
          options={yesNo}
          value={values.cctv}
          onChange={set("cctv")}
          required
          error={errors.cctv}
        />
      </FormSection>

      <FormSection
        title="Fees & Plans"
        description="Optional — you can leave this blank and confirm it on our call."
      >
        <Field
          id="feeFullDay"
          label="Full-day (per month)"
          type="number"
          icon="rupee"
          min="0"
          placeholder="e.g. 15000"
          value={values.feeFullDay}
          onChange={set("feeFullDay")}
        />
        <Field
          id="feeHalfDay"
          label="Half-day (per month)"
          type="number"
          icon="rupee"
          min="0"
          placeholder="e.g. 12000"
          value={values.feeHalfDay}
          onChange={set("feeHalfDay")}
        />
        {hasPreschool ? (
          <>
            <Field
              id="feePreschoolTuition"
              label="Preschool tuition (per month)"
              type="number"
              icon="rupee"
              min="0"
              placeholder="e.g. 8000"
              value={values.feePreschoolTuition}
              onChange={set("feePreschoolTuition")}
            />
            <Field
              id="feeAdmission"
              label="Preschool admission (one-time)"
              type="number"
              icon="rupee"
              min="0"
              placeholder="e.g. 20000"
              value={values.feeAdmission}
              onChange={set("feeAdmission")}
            />
          </>
        ) : null}
      </FormSection>

      <FormSection title="Ownership" description="How is the centre run?">
        <div className="is-wide">
          <ChoiceGroup
            label="Ownership Type"
            name="ownership"
            options={ownershipTypes}
            value={values.ownership}
            onChange={set("ownership")}
            required
            error={errors.ownership}
          />
        </div>

        {values.ownership === "Franchise" ? (
          <div className="is-wide">
            <Field
              id="franchiseBrand"
              label="Franchise Brand Name"
              icon="building"
              required
              placeholder="e.g. Little Elly"
              value={values.franchiseBrand}
              onChange={set("franchiseBrand")}
              error={errors.franchiseBrand}
              hint="You'll upload the franchise agreement in the next step."
            />
          </div>
        ) : null}
      </FormSection>
    </>
  );
}
