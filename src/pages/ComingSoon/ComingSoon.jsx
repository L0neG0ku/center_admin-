import Button from "../../components/ui/Button/Button.jsx";
import Icon from "../../icons/Icon.jsx";
import "./ComingSoon.css";

/** Placeholder so every header link resolves while the site is built in stages. */
export default function ComingSoon({ title }) {
  return (
    <section className="soon">
      <div className="shell soon__inner">
        <span className="soon__icon">
          <Icon name="sparkle" size={26} />
        </span>
        <h1>{title}</h1>
        <p>This part of the site is being built next.</p>
        <Button to="/" variant="outline">
          Back to home
        </Button>
      </div>
    </section>
  );
}
