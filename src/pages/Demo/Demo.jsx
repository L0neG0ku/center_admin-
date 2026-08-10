import Card from "../../components/ui/Card/Card.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import Icon from "../../icons/Icon.jsx";
import DemoForm from "../../components/demo/DemoForm/DemoForm.jsx";
import DemoAside from "../../components/demo/DemoAside/DemoAside.jsx";
import { demoHero, demoHighlights } from "../../data/demo.js";
import "./Demo.css";

export default function Demo() {
  return (
    <div className="demo">
      <section className="demo__hero">
        <span className="dots demo__dots demo__dots--left" aria-hidden="true" />
        <span className="dots demo__dots demo__dots--right" aria-hidden="true" />

        <div className="shell">
          <h1 className="demo__title">
            {demoHero.titleLead}
            <br />
            <span className="accent">{demoHero.titleAccent}</span>
          </h1>
          <p className="demo__lede">{demoHero.body}</p>
        </div>
      </section>

      <div className="shell demo__body">
        <Card className="demo__panel">
          <DemoForm />
          <div className="demo__divider" aria-hidden="true" />
          <DemoAside />
        </Card>

        <ul className="demo__highlights">
          {demoHighlights.map((item) => (
            <li key={item.id}>
              <span className="demo__highlight-icon">
                <Icon name={item.icon} size={22} />
              </span>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>

        <div className="demo__help">
          <span className="demo__help-icon">
            <Icon name="headset" size={22} />
          </span>
          <div>
            <strong>Need help?</strong>
            <p>Our team is happy to answer any questions you have.</p>
          </div>
          <Button to="/contact" variant="outline">
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  );
}
