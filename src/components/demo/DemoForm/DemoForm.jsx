import { useState } from "react";
import Field from "../../ui/Field/Field.jsx";
import Button from "../../ui/Button/Button.jsx";
import Icon from "../../../icons/Icon.jsx";
import { daycareTypes, indianStates, timeSlots } from "../../../data/demo.js";
import "./DemoForm.css";

const blank = {
  daycareName: "",
  ownerName: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  children: "",
  staff: "",
  type: "",
  date: "",
  time: "",
  notes: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const today = new Date().toISOString().split("T")[0];

export default function DemoForm() {
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [booked, setBooked] = useState(null);

  const set = (key) => (value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!values.daycareName.trim()) next.daycareName = "Tell us your daycare's name.";
    if (!values.ownerName.trim()) next.ownerName = "Who should we ask for?";
    if (!values.email.trim()) next.email = "We need an email to confirm.";
    else if (!emailPattern.test(values.email.trim())) next.email = "That email doesn't look right.";
    if (!values.phone.trim()) next.phone = "Add a number we can reach you on.";
    else if (values.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a 10-digit phone number.";
    if (!values.city.trim()) next.city = "Which city are you in?";
    if (!values.type) next.type = "Pick the closest match.";
    if (!values.date) next.date = "Choose a preferred date.";
    if (!values.time) next.time = "Choose a preferred time.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSending(true);
    // Stands in for the request that will post this to the backend.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSending(false);
    setBooked(values);
    setValues(blank);
  };

  if (booked) {
    return (
      <div className="demo-form demo-form--done">
        <span className="demo-form__tick">
          <Icon name="checkCircle" size={30} />
        </span>
        <h2>Your demo request is in</h2>
        <p>
          Thanks {booked.ownerName.split(" ")[0]} — we'll email{" "}
          <strong>{booked.email}</strong> to confirm your slot on{" "}
          <strong>{booked.date}</strong> at <strong>{booked.time}</strong>.
        </p>
        <Button variant="outline" onClick={() => setBooked(null)}>
          Book another demo
        </Button>
      </div>
    );
  }

  return (
    <form className="demo-form" onSubmit={handleSubmit} noValidate>
      <header className="demo-form__head">
        <span className="demo-form__badge">
          <Icon name="calendar" size={19} />
        </span>
        <div>
          <h2>Schedule a Demo</h2>
          <p>Fill out the form and our team will contact you to confirm a convenient time.</p>
        </div>
      </header>

      <div className="demo-form__grid">
        <Field
          id="daycareName"
          label="Business / Daycare Name"
          icon="building"
          required
          placeholder="Enter your daycare name"
          value={values.daycareName}
          onChange={set("daycareName")}
          error={errors.daycareName}
        />
        <Field
          id="ownerName"
          label="Owner / Manager Name"
          icon="user"
          required
          placeholder="Enter your name"
          value={values.ownerName}
          onChange={set("ownerName")}
          error={errors.ownerName}
        />
        <Field
          id="email"
          label="Work Email"
          type="email"
          icon="mail"
          required
          placeholder="you@example.com"
          value={values.email}
          onChange={set("email")}
          error={errors.email}
        />
        <Field
          id="phone"
          label="Phone Number"
          type="tel"
          icon="phone"
          required
          placeholder="+91 98765 43210"
          value={values.phone}
          onChange={set("phone")}
          error={errors.phone}
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
          placeholder="Select your state"
          value={values.state}
          onChange={set("state")}
        />
        <Field
          id="children"
          label="Number of Children"
          type="number"
          icon="users"
          min="0"
          placeholder="e.g. 50"
          value={values.children}
          onChange={set("children")}
        />
        <Field
          id="staff"
          label="Number of Staff"
          type="number"
          icon="user"
          min="0"
          placeholder="e.g. 10"
          value={values.staff}
          onChange={set("staff")}
        />

        <div className="demo-form__wide">
          <Field
            id="type"
            label="Type of Daycare"
            type="select"
            options={daycareTypes}
            required
            placeholder="Select type of daycare"
            value={values.type}
            onChange={set("type")}
            error={errors.type}
          />
        </div>

        <Field
          id="date"
          label="Preferred Date"
          type="date"
          icon="calendar"
          required
          min={today}
          value={values.date}
          onChange={set("date")}
          error={errors.date}
        />
        <Field
          id="time"
          label="Preferred Time"
          type="select"
          options={timeSlots}
          required
          placeholder="Select a time"
          value={values.time}
          onChange={set("time")}
          error={errors.time}
        />

        <div className="demo-form__wide">
          <Field
            id="notes"
            label="Additional Notes (Optional)"
            type="textarea"
            icon="pencil"
            placeholder="Tell us anything you'd like us to know before the demo..."
            value={values.notes}
            onChange={set("notes")}
          />
        </div>
      </div>

      <Button type="submit" size="lg" icon="calendar" className="demo-form__submit" disabled={sending}>
        {sending ? "Scheduling..." : "Schedule Demo"}
      </Button>

      <p className="demo-form__note">
        <Icon name="shieldCheck" size={15} />
        Your information is safe with us and will never be shared.
      </p>
    </form>
  );
}
