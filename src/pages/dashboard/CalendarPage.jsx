import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Empty,
  PageHead,
  Panel,
  Select,
  Tag,
} from "../../components/dash/ui.jsx";
import { Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import * as api from "../../api/endpoints.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * The centre's events, from `GET /daycares/me/events`.
 *
 * A list rather than a month grid. Centres run a handful of events a term,
 * and a grid of mostly-empty squares makes four sports days harder to read
 * than four rows — the calendar view was the mock's idea of what a calendar
 * page looks like, not what the data is.
 *
 * WHAT IS NOT HERE, because the API has none of it: recurring events, all-day
 * events, reminders, and anything to do with holidays or term dates. A
 * holiday today is an announcement, which is the page next door.
 */

function toLocalInput(value) {
  // datetime-local wants naive local time; the API speaks UTC.
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function when(value) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

export default function CalendarPage() {
  const toast = useToast();
  const [composing, setComposing] = useState(false);
  const [rsvpsFor, setRsvpsFor] = useState(null);

  const listCall = useResource(
    (signal) => api.listEvents({ per_page: 100 }, { signal }),
    []
  );
  const roomsCall = useResource((signal) => api.listClassrooms({ signal }), []);

  // One reading of "now" per mount. Events do not cross the boundary while
  // someone is looking at the page, and re-reading the clock on every render
  // is both impure and pointless.
  const [renderedAt] = useState(() => Date.now());

  const events = useMemo(() => listCall.data || [], [listCall.data]);
  const rooms = useMemo(() => roomsCall.data || [], [roomsCall.data]);

  const create = useAction((payload) => api.createEvent(payload));
  const remove = useAction((id) => api.deleteEvent(id));

  const { upcoming, past } = useMemo(() => {
    // Pinned per recompute rather than read during render: the compiler
    // treats Date.now() as impure, and a list that reshuffles mid-render
    // would be a real bug as well as a lint error.
    const now = renderedAt;
    const sorted = [...events].sort(
      (a, b) => new Date(a.starts_at) - new Date(b.starts_at)
    );
    return {
      upcoming: sorted.filter((e) => new Date(e.starts_at).getTime() >= now),
      past: sorted
        .filter((e) => new Date(e.starts_at).getTime() < now)
        .reverse(),
    };
  }, [events, renderedAt]);

  async function handleCreate(payload) {
    try {
      await create.run(payload);
      setComposing(false);
      listCall.reload();
      toast.show("Event added.");
    } catch (error) {
      toast.show(error?.message || "Could not add that.", "error");
    }
  }

  async function handleDelete(event) {
    if (!window.confirm(`Delete "${event.title}"? Replies are deleted too.`)) {
      return;
    }
    try {
      await remove.run(event.id);
      listCall.reload();
      toast.show("Deleted.");
    } catch (error) {
      toast.show(error?.message || "Could not delete that.", "error");
    }
  }

  return (
    <>
      <PageHead
        title="Events"
        sub="Sports days, parent evenings and outings — and who has replied."
      >
        <Btn icon="plus" onClick={() => setComposing(true)}>
          Add event
        </Btn>
      </PageHead>

      <Panel title="Coming up">
        {listCall.loading ? (
          <p className="note-box">Loading…</p>
        ) : listCall.error ? (
          <p className="note-box" style={{ borderColor: "var(--danger)" }}>
            {listCall.error.message}{" "}
            <button type="button" onClick={listCall.reload}>
              Try again
            </button>
          </p>
        ) : upcoming.length === 0 ? (
          <Empty
            icon="calendar"
            title="Nothing planned"
            body="Events appear in every parent's app as soon as you add them."
          />
        ) : (
          <div className="annlist">
            {upcoming.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                busy={remove.busy}
                onRsvps={() => setRsvpsFor(event)}
                onDelete={() => handleDelete(event)}
              />
            ))}
          </div>
        )}
      </Panel>

      {past.length > 0 && (
        <Panel title="Past" className="mt">
          <div className="annlist">
            {past.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                faded
                busy={remove.busy}
                onRsvps={() => setRsvpsFor(event)}
                onDelete={() => handleDelete(event)}
              />
            ))}
          </div>
        </Panel>
      )}

      {composing && (
        <Compose
          rooms={rooms}
          busy={create.busy}
          onClose={() => setComposing(false)}
          onCreate={handleCreate}
        />
      )}

      {rsvpsFor && (
        <RsvpList event={rsvpsFor} onClose={() => setRsvpsFor(null)} />
      )}
    </>
  );
}

function EventRow({ event, faded, busy, onRsvps, onDelete }) {
  return (
    <article className="annrow" style={faded ? { opacity: 0.65 } : undefined}>
      <div className="annrow__main">
        <div className="annrow__head">
          <strong>{event.title}</strong>
          {event.rsvp_required && <Tag tone="brand">RSVP</Tag>}
          <Tag tone="grey">
            {event.classroom_id ? "One room" : "Whole centre"}
          </Tag>
        </div>
        {event.description && (
          <p className="annrow__body">{event.description}</p>
        )}
        <p className="annrow__meta">
          {when(event.starts_at)}
          {event.ends_at && ` – ${when(event.ends_at)}`}
          {event.venue && ` · ${event.venue}`}
        </p>
      </div>

      <div className="annrow__side">
        <div className="annrow__actions">
          {event.rsvp_required && (
            <button type="button" onClick={onRsvps}>
              Who is coming
            </button>
          )}
          <button type="button" disabled={busy} onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function Compose({ rooms, busy, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(() =>
    toLocalInput(Date.now() + 86400000)
  );
  const [endsAt, setEndsAt] = useState("");
  const [venue, setVenue] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [rsvp, setRsvp] = useState(false);

  const valid = title.trim().length >= 3 && startsAt;

  return (
    <Modal
      title="Add an event"
      sub="Parents see it in their app straight away."
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            icon="calendar"
            disabled={!valid || busy}
            onClick={() =>
              onCreate({
                title: title.trim(),
                description: description.trim() || null,
                starts_at: new Date(startsAt).toISOString(),
                ends_at: endsAt ? new Date(endsAt).toISOString() : null,
                venue: venue.trim() || null,
                classroom_id: classroomId || null,
                rsvp_required: rsvp,
              })
            }
          >
            {busy ? "Adding..." : "Add event"}
          </Btn>
        </>
      }
    >
      <div>
        <label className="dfield">
          <span>Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Sports day"
          />
        </label>

        <label className="dfield">
          <span>Details (optional)</span>
          <textarea
            value={description}
            rows={3}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Please send children in comfortable shoes."
          />
        </label>

        <div className="dfield-2">
          <label className="dfield">
            <span>Starts</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </label>
          <label className="dfield">
            <span>Ends (optional)</span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </label>
        </div>

        <label className="dfield">
          <span>Where (optional)</span>
          <input
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            placeholder="The park behind the centre"
          />
        </label>

        <label className="dfield">
          <span>Who it is for</span>
          <Select
            value={classroomId}
            onChange={setClassroomId}
            placeholder="Whole centre"
            options={[
              { value: "", label: "Whole centre" },
              ...rooms.map((room) => ({ value: room.id, label: room.name })),
            ]}
          />
        </label>

        <label className="dfield">
          <span>
            <input
              type="checkbox"
              checked={rsvp}
              onChange={(event) => setRsvp(event.target.checked)}
            />{" "}
            Ask parents to reply
          </span>
        </label>
      </div>
    </Modal>
  );
}

function RsvpList({ event, onClose }) {
  const call = useResource(
    (signal) => api.getEventRsvps(event.id, { signal }),
    [event.id]
  );
  const rows = useMemo(() => call.data || [], [call.data]);

  const going = rows.filter((row) => row.status === "GOING");
  const notGoing = rows.filter((row) => row.status === "NOT_GOING");

  return (
    <Modal
      title={event.title}
      sub="Who has replied"
      onClose={onClose}
      footer={<Btn onClick={onClose}>Close</Btn>}
    >
      {call.loading ? (
        <p className="note-box">Loading…</p>
      ) : call.error ? (
        <p className="note-box" style={{ borderColor: "var(--danger)" }}>
          {call.error.message}
        </p>
      ) : rows.length === 0 ? (
        <Empty
          icon="users"
          title="No replies yet"
          body="Parents answer from their app."
        />
      ) : (
        <>
          <p className="note-box" style={{ marginBottom: 12 }}>
            <Icon name="checkCircle" size={15} /> {going.length} going ·{" "}
            {notGoing.length} cannot make it
          </p>
          <div className="annlist">
            {rows.map((row) => (
              <div key={row.id} className="drow">
                <span>{row.child_name || row.child_public_id}</span>
                <strong>
                  {row.status === "GOING" ? "Going" : "Not going"}
                </strong>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
