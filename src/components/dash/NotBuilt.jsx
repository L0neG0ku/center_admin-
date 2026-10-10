import Icon from "../../icons/Icon.jsx";
import { PageHead, Panel } from "./ui.jsx";

/**
 * A page whose feature does not exist yet.
 *
 * These pages used to render mock data — invoices, enquiries, support
 * tickets — against a real centre's name. An owner reading an invented
 * revenue figure for their own business during a pilot is the worst failure
 * this console can have, and it is worse than an empty screen because nothing
 * about it looks wrong.
 *
 * So the page says what is missing, what to do instead today, and roughly
 * when. The alternative — hiding the nav entry — leaves people hunting for a
 * feature they were told about.
 */
export default function NotBuilt({ title, sub, icon = "sparkle", instead, when }) {
  return (
    <>
      <PageHead title={title} sub={sub} />
      <Panel>
        <div className="notbuilt">
          <Icon name={icon} size={30} />
          <h3>Not built yet</h3>
          <p>{sub}</p>
          {instead && (
            <p className="notbuilt__instead">
              <strong>Until then:</strong> {instead}
            </p>
          )}
          {when && <p className="notbuilt__when">{when}</p>}
        </div>
      </Panel>
    </>
  );
}
