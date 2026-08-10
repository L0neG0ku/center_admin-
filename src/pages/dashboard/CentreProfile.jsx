import { useState } from "react";
import Icon from "../../icons/Icon.jsx";
import { Btn, Fact, PageHead, Panel, Row, StatCard, Tabs, Tag } from "../../components/dash/ui.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import {
  centre,
  centrePhotos,
  facilities,
  licenceTone,
  licences,
  openingHours,
  verificationTimeline,
} from "../../data/dash/centre.js";

export default function CentreProfile() {
  const toast = useToast();
  const [tab, setTab] = useState("details");
  const [switches, setSwitches] = useState(
    Object.fromEntries(facilities.map((facility) => [facility.id, facility.on]))
  );

  return (
    <>
      <PageHead title="Centre Profile" sub="What parents see on your Kribble listing">
        <Btn variant="outline" icon="eye" onClick={() => toast("Opening your public listing preview")}>
          Preview listing
        </Btn>
        <Btn icon="pencil" onClick={() => toast("Centre profile saved")}>
          Save changes
        </Btn>
      </PageHead>

      <div className="profilehero">
        <span className="profilehero__mark">
          <Icon name="building" size={26} />
        </span>
        <div className="profilehero__text">
          <div className="profilehero__title">
            <h2>{centre.name}</h2>
            <Tag tone="green" dot>
              {centre.status}
            </Tag>
          </div>
          <p className="muted">
            {centre.id} · {centre.type} · {centre.ownership}
          </p>
          <p className="muted">{centre.address}</p>
        </div>
        <div className="profilehero__stats">
          <div>
            <strong>{centre.rating}</strong>
            <span>
              <Icon name="star" size={13} /> {centre.reviews} reviews
            </span>
          </div>
          <div>
            <strong>{centre.enrolled}</strong>
            <span>children enrolled</span>
          </div>
          <div>
            <strong>{centre.listingViews}</strong>
            <span>listing views</span>
          </div>
        </div>
      </div>

      <div style={{ margin: "18px 0" }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "details", label: "Centre details" },
            { id: "hours", label: "Hours & facilities" },
            { id: "photos", label: "Photos" },
            { id: "docs", label: "Licences" },
            { id: "verification", label: "Verification" },
          ]}
        />
      </div>

      {tab === "details" ? (
        <div className="dcols dcols--main">
          <Panel title="Centre details">
            <div className="dgrid">
              <Fact label="Display name" value={centre.name} />
              <Fact label="Legal name" value={centre.legalName} />
              <Fact label="Centre type" value={centre.type} />
              <Fact label="Ownership" value={centre.ownership} />
              <Fact label="Owner" value={centre.owner} />
              <Fact label="Centre manager" value={centre.manager} />
              <Fact label="Email" value={centre.email} />
              <Fact label="Phone" value={centre.phone} />
            </div>
            <div style={{ marginTop: 16 }}>
              <Fact label="Address" value={centre.address} />
            </div>
          </Panel>

          <div className="dstack">
            <Panel title="Capacity">
              <Row label="Total capacity" value={`${centre.capacity} seats`} />
              <Row label="Currently enrolled" value={centre.enrolled} />
              <Row label="Seats free" value={centre.capacity - centre.enrolled} />
              <div className="dbar" style={{ marginTop: 14 }}>
                <span style={{ width: `${(centre.enrolled / centre.capacity) * 100}%` }} />
              </div>
              <p className="muted" style={{ marginTop: 8, fontSize: 12.5 }}>
                {Math.round((centre.enrolled / centre.capacity) * 100)}% full
              </p>
            </Panel>

            <Panel title="On Kribble since">
              <Row label="Joined" value={centre.joinedOn} />
              <Row label="Staff on record" value={centre.staffCount} />
              <Row label="Listing status" value={<Tag tone="green">Live</Tag>} />
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "hours" ? (
        <div className="dcols dcols--main">
          <Panel title="Operating hours" sub="Parents see these on your listing">
            <ul className="hours">
              {openingHours.map((day) => (
                <li key={day.day} className={day.closed ? "is-closed" : ""}>
                  <strong>{day.day}</strong>
                  <span>{day.closed ? "Closed" : `${day.from} – ${day.to}`}</span>
                  <Btn size="sm" variant="outline" onClick={() => toast(`${day.day} hours updated`)}>
                    Edit
                  </Btn>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Facilities" sub="Turn on what your centre offers">
            <ul className="facilities">
              {facilities.map((facility) => (
                <li key={facility.id}>
                  <span className={`facilities__icon ${switches[facility.id] ? "tone-brand" : "tone-grey"}`}>
                    <Icon name={facility.icon} size={17} />
                  </span>
                  <strong>{facility.label}</strong>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={switches[facility.id]}
                    aria-label={facility.label}
                    className={`dswitch__track ${switches[facility.id] ? "is-on" : ""}`.trim()}
                    onClick={() =>
                      setSwitches((current) => ({ ...current, [facility.id]: !current[facility.id] }))
                    }
                  >
                    <span className="dswitch__knob" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      ) : null}

      {tab === "photos" ? (
        <Panel
          title="Listing photos"
          sub="Good photos are the single biggest driver of enquiries"
          tools={
            <Btn size="sm" variant="soft" icon="cloudUpload" onClick={() => toast("Photo upload arrives with the backend")}>
              Upload
            </Btn>
          }
        >
          <ul className="photogrid">
            {centrePhotos.map((group) => (
              <li key={group.id}>
                <span className={`photogrid__tile tone-${group.tone}`}>
                  <Icon name="image" size={26} />
                  <em>{group.count}</em>
                </span>
                <strong>{group.label}</strong>
                <span className="muted">
                  {group.count} photo{group.count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {tab === "docs" ? (
        <div className="dcols dcols--main">
          <Panel title="Licences & documents" sub="Kribble checks these stay current">
            <ul className="doclist doclist--lg">
              {licences.map((licence) => (
                <li key={licence.id}>
                  <span className={`mini-card__icon tone-${licenceTone[licence.status]}`}>
                    <Icon name="fileCheck" size={17} />
                  </span>
                  <div>
                    <strong>{licence.name}</strong>
                    <span className="muted">
                      {licence.note || (licence.expiry !== "—" ? `Valid until ${licence.expiry}` : "No expiry")}
                    </span>
                  </div>
                  <Tag tone={licenceTone[licence.status]} dot>
                    {licence.status}
                  </Tag>
                  <Btn size="sm" variant="outline" onClick={() => toast(`${licence.name} re-uploaded`)}>
                    Replace
                  </Btn>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Action needed">
            <p className="note-box note-box--warn">
              <Icon name="alertTriangle" size={16} />
              Your FSSAI licence expires soon. Upload the renewal before it lapses, or meals will be
              hidden from your listing.
            </p>
            <Btn icon="cloudUpload" className="dbtn--block" onClick={() => toast("Upload dialog opens with the backend")}>
              Upload renewal
            </Btn>
          </Panel>
        </div>
      ) : null}

      {tab === "verification" ? (
        <div className="dcols dcols--main">
          <Panel title="Verification history" sub="How your centre got its verified badge">
            <ol className="timeline">
              {verificationTimeline.map((stage) => (
                <li key={stage.id}>
                  <span className={`timeline__icon ${stage.done ? "tone-green" : "tone-amber"}`}>
                    <Icon name={stage.done ? "checkCircle" : "clock"} size={17} />
                  </span>
                  <div className="timeline__body">
                    <div className="timeline__head">
                      <strong>{stage.title}</strong>
                      <span className="nowrap muted">{stage.on}</span>
                    </div>
                    <span className="muted">{stage.body}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <div className="dstack">
            <div className="stats" style={{ gridTemplateColumns: "1fr", marginBottom: 0 }}>
              <StatCard icon="shieldCheck" tone="green" label="Verification status" value="Verified" delta={{ dir: "flat", text: `Since ${centre.joinedOn}` }} />
            </div>
            <Panel title="What the badge does">
              <ul className="ticklist">
                <li>
                  <Icon name="checkCircle" size={16} />
                  Your listing ranks above unverified centres
                </li>
                <li>
                  <Icon name="checkCircle" size={16} />
                  Parents see the verified badge on your profile
                </li>
                <li>
                  <Icon name="checkCircle" size={16} />
                  You can accept payments through Kribble
                </li>
              </ul>
            </Panel>
          </div>
        </div>
      ) : null}
    </>
  );
}
