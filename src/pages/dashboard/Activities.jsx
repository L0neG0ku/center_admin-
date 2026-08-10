import { useState } from "react";
import Icon from "../../icons/Icon.jsx";
import { Btn, PageHead, Panel, Tabs, Tag } from "../../components/dash/ui.jsx";
import { Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import { activities, daySchedule, gallery } from "../../data/dash/activities.js";
import { classroomNames } from "../../data/dash/seed.js";
import { todayLabel } from "../../data/dash/overview.js";

export default function Activities() {
  const toast = useToast();
  const [tab, setTab] = useState("schedule");
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHead title="Activities" sub={`${todayLabel} · daily schedule and classroom activities`}>
        <Btn variant="outline" icon="camera" onClick={() => toast("Photo upload opens with the backend")}>
          Upload photos
        </Btn>
        <Btn icon="plus" onClick={() => setCreating(true)}>
          Log an activity
        </Btn>
      </PageHead>

      <div style={{ marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "schedule", label: "Daily schedule" },
            { id: "log", label: "Activity log", count: activities.length },
            { id: "photos", label: "Photos", count: gallery.length },
          ]}
        />
      </div>

      {tab === "schedule" ? (
        <div className="dcols dcols--main">
          <Panel title="Today's rhythm" sub="The same schedule parents see in the app">
            <ol className="timeline">
              {daySchedule.map((slot) => (
                <li key={slot.id}>
                  <span className={`timeline__icon tone-${slot.tone}`}>
                    <Icon name={slot.icon} size={17} />
                  </span>
                  <div className="timeline__body">
                    <div className="timeline__head">
                      <strong>{slot.title}</strong>
                      <span className="nowrap muted">
                        {slot.from} – {slot.to}
                      </span>
                    </div>
                    <span className="muted">{slot.room}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <div className="dstack">
            <Panel title="Running now">
              <div className="nowcard">
                <span className="nowcard__icon tone-brand">
                  <Icon name="palette" size={22} />
                </span>
                <strong>Art &amp; craft</strong>
                <span className="muted">Daisies &amp; Bluebells · 3:15 PM – 4:00 PM</span>
                <Btn
                  size="sm"
                  variant="soft"
                  icon="camera"
                  onClick={() => toast("Camera opens on the teacher app")}
                >
                  Add photos
                </Btn>
              </div>
            </Panel>

            <Panel title="This week" sub="Activities logged per classroom">
              <ul className="statlist">
                {classroomNames.map((name, index) => (
                  <li key={name}>
                    <span>{name}</span>
                    <strong>{[4, 6, 7, 8, 9][index]} activities</strong>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "log" ? (
        <ul className="actlist">
          {activities.map((activity) => (
            <li key={activity.id}>
              <article className="actcard">
                <span className={`actcard__icon tone-${activity.tone}`}>
                  <Icon name={activity.icon} size={22} />
                </span>
                <div className="actcard__body">
                  <div className="actcard__head">
                    <strong>{activity.title}</strong>
                    {activity.shared ? (
                      <Tag tone="green" dot>
                        Shared
                      </Tag>
                    ) : (
                      <Tag tone="amber" dot>
                        Draft
                      </Tag>
                    )}
                  </div>
                  <p>{activity.note}</p>
                  <div className="actcard__meta">
                    <span>
                      <Icon name="building" size={14} /> {activity.classroom}
                    </span>
                    <span>
                      <Icon name="clock" size={14} /> {activity.dateLabel}, {activity.slot}
                    </span>
                    <span>
                      <Icon name="user" size={14} /> {activity.lead}
                    </span>
                    <span>
                      <Icon name="camera" size={14} /> {activity.photos} photos
                    </span>
                  </div>
                </div>
                <Btn
                  size="sm"
                  variant={activity.shared ? "outline" : "primary"}
                  onClick={() => toast(activity.shared ? "Opened in the parent app" : "Activity shared with parents")}
                >
                  {activity.shared ? "View" : "Share"}
                </Btn>
              </article>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "photos" ? (
        <Panel title="Photo gallery" sub="Uploads are visible to the parents of that classroom only">
          <ul className="gallery">
            {gallery.map((photo) => (
              <li key={photo.id}>
                <button type="button" onClick={() => toast("Full-size preview arrives with the backend")}>
                  <span className={`gallery__tile tone-${photo.tone}`}>
                    <Icon name={photo.icon} size={26} />
                  </span>
                  <strong>{photo.activity}</strong>
                  <span className="muted">
                    {photo.classroom} · {photo.when}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {creating ? (
        <Modal
          title="Log an activity"
          sub="Describe what the children did — parents see this in their feed."
          onClose={() => setCreating(false)}
          footer={
            <>
              <Btn variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Btn>
              <Btn
                icon="check"
                onClick={() => {
                  setCreating(false);
                  toast("Activity logged");
                }}
              >
                Save activity
              </Btn>
            </>
          }
        >
          <label className="dfield">
            <span>Activity title</span>
            <input placeholder="e.g. Monsoon collage with leaves" />
          </label>
          <div className="dfield-2">
            <label className="dfield">
              <span>Classroom</span>
              <select defaultValue="">
                <option value="">Select a classroom</option>
                {classroomNames.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="dfield">
              <span>Time</span>
              <input type="time" />
            </label>
          </div>
          <label className="dfield">
            <span>What happened?</span>
            <textarea placeholder="A couple of lines parents will enjoy reading" />
          </label>
        </Modal>
      ) : null}
    </>
  );
}
