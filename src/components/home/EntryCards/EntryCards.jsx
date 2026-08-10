import { Link } from "react-router-dom";
import Icon from "../../../icons/Icon.jsx";
import { entryCards } from "../../../data/home.js";
import "./EntryCards.css";

export default function EntryCards() {
  return (
    <section className="entry">
      <div className="shell entry__grid">
        {entryCards.map((card) => (
          <Link key={card.id} to={card.to} className="entry__card">
            <span className="entry__icon">
              <Icon name={card.icon} size={26} />
            </span>

            <div className="entry__text">
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </div>

            <span className="entry__go" aria-hidden="true">
              <Icon name="arrowRight" size={18} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
