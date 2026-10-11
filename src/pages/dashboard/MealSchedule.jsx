import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Empty,
  PageHead,
  Panel,
  Tag,
} from "../../components/dash/ui.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import * as api from "../../api/endpoints.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * The centre's mealtimes.
 *
 * **Why this page exists at all.** The parent's app used to draw a fixed
 * Breakfast / Lunch / Snack frame and grey out whichever had no log. That
 * reads as "your child was offered lunch and refused it" when the truth is
 * "nobody has written it down yet" — and at a centre that serves no
 * breakfast, it invented a meal. The frame was deleted. Setting the schedule
 * here is what brings it back honestly: these are the sittings the family is
 * shown, and anything not listed is not drawn anywhere.
 *
 * Two rules in the API shape the editor:
 *
 *  1. **A room's slots replace the centre's entirely — never merged.** A room
 *     that sets its own times has a different day, usually because the babies
 *     eat earlier, and a merged timetable is one nobody runs. So the page
 *     groups by room and says plainly what a room's own list does.
 *  2. **The save replaces the whole set.** There is no per-slot route, on
 *     purpose: a schedule is read as a whole. So this edits a local draft and
 *     sends everything at once, and says how many slots are about to exist.
 *
 * Times are wall-clock at the centre, not instants. "Lunch at 12:30" is true
 * every day; storing it as a timestamp would make it drift.
 */

const KINDS = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "SNACK", label: "Snack" },
];

const CENTRE_WIDE = "__centre__";

const hhmm = (value) => (value || "").slice(0, 5);

const minutesOf = (value) => {
  const [h, m] = hhmm(value).split(":");
  return (Number(h) || 0) * 60 + (Number(m) || 0);
};

/** One server slot as an editable row. */
function toDraftSlot(slot) {
  return {
    localId: slot.id,
    id: slot.id,
    kind: slot.kind,
    label: slot.label || "",
    served_from: hhmm(slot.served_from),
    served_to: slot.served_to ? hhmm(slot.served_to) : "",
    classroom_id: slot.classroom_id || null,
    is_active: slot.is_active !== false,
  };
}

let draftSeq = 0;
const nextDraftId = () => `draft-${(draftSeq += 1)}`;

export default function MealSchedule() {
  const toast = useToast();
  const listCall = useResource((signal) => api.listMealSlots({ signal }), []);
  const roomsCall = useResource(
    (signal) => api.listClassrooms({ signal }),
    []
  );
  const save = useAction((slots) => api.putMealSlots(slots));

  /* Null until the owner touches something. The rendered list is then
     `edits ?? fromServer`, so there is no state to keep in sync with the
     fetch — and a background reload cannot discard what is half typed. */
  const [edits, setEdits] = useState(null);

  const fromServer = useMemo(
    () => (listCall.data || []).map(toDraftSlot),
    [listCall.data]
  );

  const draft = edits ?? (listCall.data ? fromServer : null);

  const rooms = useMemo(() => roomsCall.data || [], [roomsCall.data]);
  const roomName = (id) =>
    rooms.find((room) => room.id === id)?.name || "A room";

  const groups = useMemo(() => {
    if (!draft) return [];
    const byRoom = new Map([[CENTRE_WIDE, []]]);
    for (const slot of draft) {
      const key = slot.classroom_id || CENTRE_WIDE;
      if (!byRoom.has(key)) byRoom.set(key, []);
      byRoom.get(key).push(slot);
    }
    for (const list of byRoom.values()) {
      list.sort((a, b) => minutesOf(a.served_from) - minutesOf(b.served_from));
    }
    return [...byRoom.entries()];
  }, [draft]);

  const dirty = useMemo(
    () =>
      draft !== null &&
      JSON.stringify(draft) !== JSON.stringify(fromServer),
    [draft, fromServer]
  );

  const invalid = useMemo(
    () =>
      (draft || []).filter(
        (slot) =>
          !slot.served_from ||
          !slot.label.trim() ||
          (slot.served_to && minutesOf(slot.served_to) <= minutesOf(slot.served_from))
      ),
    [draft]
  );

  function update(localId, changes) {
    setEdits((current) =>
      (current ?? fromServer).map((slot) =>
        slot.localId === localId ? { ...slot, ...changes } : slot
      )
    );
  }

  function add(classroomId) {
    setEdits((current) => [
      ...(current ?? fromServer),
      {
        localId: nextDraftId(),
        kind: "SNACK",
        label: "",
        served_from: "10:00",
        served_to: "",
        classroom_id: classroomId === CENTRE_WIDE ? null : classroomId,
        is_active: true,
      },
    ]);
  }

  function remove(localId) {
    setEdits((current) =>
      (current ?? fromServer).filter((slot) => slot.localId !== localId)
    );
  }

  async function handleSave() {
    try {
      await save.run(
        draft.map((slot) => ({
          kind: slot.kind,
          label: slot.label.trim(),
          served_from: `${slot.served_from}:00`,
          ...(slot.served_to ? { served_to: `${slot.served_to}:00` } : {}),
          ...(slot.classroom_id ? { classroom_id: slot.classroom_id } : {}),
          is_active: slot.is_active,
        }))
      );
      setEdits(null);
      listCall.reload();
      toast.show("Mealtimes saved. Families see these now.");
    } catch (error) {
      toast.show(error?.message || "Could not save the mealtimes.", "error");
    }
  }

  const roomsWithOwnSlots = groups
    .filter(([key, list]) => key !== CENTRE_WIDE && list.length > 0)
    .map(([key]) => key);

  return (
    <>
      <PageHead
        title="Mealtimes"
        sub="The sittings families are shown. A meal you do not list is not shown at all."
      >
        <Btn
          icon="check"
          disabled={!dirty || invalid.length > 0 || save.running}
          onClick={handleSave}
        >
          {save.running
            ? "Saving…"
            : dirty
              ? `Save ${draft?.length ?? 0} sittings`
              : "Saved"}
        </Btn>
      </PageHead>

      <p className="note-box" style={{ marginBottom: 16 }}>
        <Icon name="utensils" size={15} />{" "}
        <strong>Why this matters.</strong> A family only sees the sittings you
        list here. One with nothing logged reads as{" "}
        <em>&ldquo;not written down&rdquo;</em> before the time passes and{" "}
        <em>&ldquo;later today&rdquo;</em> after — never as a child refusing
        food. Listing a meal you do not serve would show a family a sitting
        that never happens.
      </p>

      {invalid.length > 0 && (
        <p className="note-box" style={{ marginBottom: 16, borderColor: "var(--danger)" }}>
          <Icon name="alertTriangle" size={15} />{" "}
          {invalid.length === 1
            ? "One sitting is incomplete"
            : `${invalid.length} sittings are incomplete`}{" "}
          — each needs a name and a start time, and an end time must come after
          the start.
        </p>
      )}

      {listCall.loading || !draft ? (
        <p className="note-box">Loading the schedule…</p>
      ) : listCall.error ? (
        <p className="note-box" style={{ borderColor: "var(--danger)" }}>
          {listCall.error.message}{" "}
          <button type="button" onClick={listCall.reload}>
            Try again
          </button>
        </p>
      ) : (
        groups.map(([key, list]) => (
          <Panel
            key={key}
            title={key === CENTRE_WIDE ? "The whole centre" : roomName(key)}
            sub={
              key === CENTRE_WIDE
                ? roomsWithOwnSlots.length > 0
                  ? `Used by every room except ${roomsWithOwnSlots
                      .map(roomName)
                      .join(", ")}.`
                  : "Used by every room."
                : /* The rule said where it has an effect, not in a footnote. */
                  "These REPLACE the centre's list for this room — they are not added to it."
            }
            action={
              <Btn variant="outline" size="sm" icon="plus" onClick={() => add(key)}>
                Add a sitting
              </Btn>
            }
          >
            {list.length === 0 ? (
              <Empty
                icon="utensils"
                title={
                  key === CENTRE_WIDE
                    ? "No mealtimes set"
                    : "Uses the centre's times"
                }
                body={
                  key === CENTRE_WIDE
                    ? "Until you add one, families see only the meals your staff log, with no timetable."
                    : "Add one only if this room eats at different times from the rest of the centre."
                }
              />
            ) : (
              <div className="annlist">
                {list.map((slot) => (
                  <SlotRow
                    key={slot.localId}
                    slot={slot}
                    onChange={(changes) => update(slot.localId, changes)}
                    onRemove={() => remove(slot.localId)}
                  />
                ))}
              </div>
            )}
          </Panel>
        ))
      )}

      {draft && rooms.length > 0 && (
        <Panel
          title="Rooms that eat at the centre's times"
          sub="Nothing to do here unless a room's day is different."
        >
          <div className="annlist">
            {rooms
              .filter((room) => !roomsWithOwnSlots.includes(room.id))
              .map((room) => (
                <div className="annrow" key={room.id}>
                  <div style={{ flex: 1 }}>{room.name}</div>
                  <Btn
                    variant="outline"
                    size="sm"
                    icon="plus"
                    onClick={() => add(room.id)}
                  >
                    Give it its own times
                  </Btn>
                </div>
              ))}
          </div>
        </Panel>
      )}
    </>
  );
}

function SlotRow({ slot, onChange, onRemove }) {
  const endsBeforeStart =
    slot.served_to && minutesOf(slot.served_to) <= minutesOf(slot.served_from);

  return (
    <div className="annrow" style={{ alignItems: "flex-start", gap: 12 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "140px 1fr 110px 110px",
          gap: 10,
          flex: 1,
          minWidth: 0,
        }}
      >
        <label className="dfield" style={{ margin: 0 }}>
          <span>Meal</span>
          <select
            value={slot.kind}
            onChange={(e) => onChange({ kind: e.target.value })}
          >
            {KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </label>

        <label className="dfield" style={{ margin: 0 }}>
          <span>What you call it</span>
          <input
            value={slot.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Morning snack"
          />
          {/* The reason a label is required rather than nice to have. */}
          <small className="muted">
            How two snacks are told apart, in the app and on this page.
          </small>
        </label>

        <label className="dfield" style={{ margin: 0 }}>
          <span>From</span>
          <input
            type="time"
            value={slot.served_from}
            onChange={(e) => onChange({ served_from: e.target.value })}
          />
        </label>

        <label className="dfield" style={{ margin: 0 }}>
          <span>To (optional)</span>
          <input
            type="time"
            value={slot.served_to}
            onChange={(e) => onChange({ served_to: e.target.value })}
          />
          {endsBeforeStart && (
            <small style={{ color: "var(--danger)" }}>After the start.</small>
          )}
        </label>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          alignItems: "flex-end",
          flexShrink: 0,
        }}
      >
        {!slot.id && <Tag tone="amber">Not saved yet</Tag>}
        <label
          style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}
        >
          <input
            type="checkbox"
            checked={slot.is_active}
            onChange={(e) => onChange({ is_active: e.target.checked })}
          />
          Serving
        </label>
        {/* Turning a sitting off keeps it on record for the term it ran;
            removing it takes it out of the family's view entirely. */}
        <Btn variant="outline" size="sm" icon="trash" onClick={onRemove}>
          Remove
        </Btn>
      </div>
    </div>
  );
}
