import Button from "../../ui/Button/Button.jsx";
import Pill from "../../ui/Pill/Pill.jsx";
import heroArt from "../../../assets/hero-illustration.png";
import { hero } from "../../../data/home.js";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero">
      <span className="dots hero__dots" aria-hidden="true" />

      <div className="shell hero__inner">
        <div className="hero__copy">
          <Pill icon="sparkle">{hero.badge}</Pill>

          <h1 className="hero__title">
            {hero.titleLead}
            <br />
            <span className="accent">{hero.titleAccent}</span>
          </h1>

          <p className="hero__tagline">{hero.tagline}</p>
          <p className="hero__body">{hero.body}</p>

          <div className="hero__actions">
            <Button to={hero.primary.to} size="lg">
              {hero.primary.label}
            </Button>
            <Button to={hero.secondary.to} variant="outline" size="lg">
              {hero.secondary.label}
            </Button>
          </div>
        </div>

        <div className="hero__art">
          <img src={heroArt} alt="A carer playing with two children" />
        </div>
      </div>
    </section>
  );
}
