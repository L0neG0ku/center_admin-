import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Empty,
  PageHead,
  Panel,
  Search,
  StatCard,
  Tag,
} from "../../components/dash/ui.jsx";
import { Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import * as api from "../../api/endpoints.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * What the rooms have written about the children.
 *
 * **There are no scores on this page and there must never be.** The API
 * stores a note, a time, an author and one or more development-area tags. It
 * stores no rating, level, percentage or ranking, so any number here that
 * looked like an assessment would have been invented — which is exactly what
 * the old mock version of the parent's learning tracker did, with percentage
 * bars drawn from a file.
 *
 * What an owner can legitimately see is coverage: how many notes exist, which
 * areas the rooms are writing about, and which children nobody has written
 * about lately. The last one is the useful one, and it is a prompt rather
 * than a measure — the quiet child is the one who gets missed.
 *
 * An owner can remove any observation. Unlike an incident or a dose, which
 * nobody can delete, this is pedagogy rather than safeguarding: a note about
 * the wrong child is not evidence of anything.
 */

const AREA_LABEL = {
  PHYSICAL: "Moving and physical play",
  LANGUAGE: "Talking and listening",
  COGNITIVE: "Thinking and problem solving",
  SOCIAL_EMOTIONAL: "Feelings and friendships",
  CREATIVE: "Making and imagining",
  SELF_HELP: "Doing things for themselves",
};

const AREA_SHORT = {
  PHYSICAL: "Physical",
  LANGUAGE: "Language",
  COGNITIVE: "Thinking",
  SOCIAL_EMOTIONAL: "Feelings",
  CREATIVE: "Creative",
  SELF_HELP: "Independence",
};

function when(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

export default function Observations() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [removing, setRemoving] = useState(null);

  const listCall = useResource(
    (signal) => api.listObservations({ per_page: 200 }, { signal }),
    []
  );

  const observations = useMemo(() => listCall.data || [], [listCall.data]);
  const remove = useAction((id) => api.deleteObservation(id));

  /* Counts of notes per area, never sorted into a ranking. "Most written
     about" is not "the room is best at", and ordering by count would invite
     exactly that reading. Object key order is the enum's order. */
  const byArea = useMemo(() => {
    const counts = {};
    for (const key of Object.keys(AREA_LABEL)) counts[key] = 0;
    for (const observation of observations) {
      for (const a of observation.areas || []) {
        if (a in counts) counts[a] += 1;
      }
    }
    return counts;
  }, [observations]);

  const authors = useMemo(
    () =>
      new Set(
        observations.map((o) => o.observed_by?.id).filter(Boolean)
      ).size,
    [observations]
  );

  const children = useMemo(
    () => new Set(observations.map((o) => o.child_id)).size,
    [observations]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return observations.filter((o) => {
      if (area && !(o.areas || []).includes(area)) return false;
      if (!needle) return true;
      return (
        (o.child_name || "").toLowerCase().includes(needle) ||
        (o.note || "").toLowerCase().includes(needle) ||
        (o.classroom_name || "").toLowerCase().includes(needle)
      );
    });
  }, [observations, query, area]);

  async function handleRemove() {
    try {
      await remove.run(removing.id);
      setRemoving(null);
      listCall.reload();
      toast.show("Removed.");
    } catch (error) {
      toast.show(error?.message || "Could not remove that.", "error");
    }
  }

  return (
    <>
      <PageHead
        title="Observations"
        sub="What your rooms have written about the children. Notes, not scores."
      />

      <div className="stats" style={{ marginBottom: 18 }}>
        <StatCard
          icon="bookOpen"
          tone="brand"
          label="Notes written"
          value={observations.length}
        />
        <StatCard
          icon="baby"
          tone="blue"
          label="Children written about"
          value={children}
        />
        <StatCard icon="users" tone="green" label="Staff writing" value={authors} />
      </div>

      <Panel
        title="What the rooms are writing about"
        sub="Counts of notes per area. Not a measure of anything — a count means the centre wrote about it, not that a child is better or worse at it."
      >
        <div className="annlist">
          {Object.entries(byArea).map(([key, count]) => (
            <div className="annrow" key={key}>
              <div style={{ flex: 1 }}>{AREA_LABEL[key]}</div>
              <div style={{ flexShrink: 0 }}>
                {/* Plain counts. No bar, because a bar implies a maximum and
                    there is no maximum here. */}
                {count === 0 ? (
                  <span className="muted">nothing written yet</span>
                ) : (
                  <strong>
                    {count} {count === 1 ? "note" : "notes"}
                  </strong>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Notes"
        tools={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">Any area</option>
              {Object.entries(AREA_SHORT).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <Search
              value={query}
              onChange={setQuery}
              placeholder="Child, room or words..."
            />
          </div>
        }
      >
        {listCall.loading ? (
          <p className="note-box">Loading…</p>
        ) : listCall.error ? (
          <p className="note-box" style={{ borderColor: "var(--danger)" }}>
            {listCall.error.message}{" "}
            <button type="button" onClick={listCall.reload}>
              Try again
            </button>
          </p>
        ) : filtered.length === 0 ? (
          <Empty
            icon="bookOpen"
            title={observations.length === 0 ? "Nothing written yet" : "No match"}
            body={
              observations.length === 0
                ? "Caretakers write these from the app when they notice something worth remembering."
                : "No note matches that."
            }
          />
        ) : (
          <div className="annlist">
            {filtered.map((observation) => (
              <ObservationRow
                key={observation.id}
                observation={observation}
                onRemove={() => setRemoving(observation)}
              />
            ))}
          </div>
        )}
      </Panel>

      {removing && (
        <Modal
          title="Remove this note?"
          onClose={() => setRemoving(null)}
          footer={
            <>
              <Btn variant="outline" onClick={() => setRemoving(null)}>
                Keep it
              </Btn>
              <Btn variant="danger" disabled={remove.running} onClick={handleRemove}>
                {remove.running ? "Removing…" : "Remove"}
              </Btn>
            </>
          }
        >
          <p>
            {/* Honest about who has already seen it. */}
            The family may already have read this. Removing it takes it out of
            their app too.
          </p>
          <p className="note-box" style={{ marginTop: 12 }}>
            {observationPreview(removing)}
          </p>
        </Modal>
      )}
    </>
  );
}

function observationPreview(observation) {
  return `${observation.child_name || "A child"} — ${observation.note}`;
}

function ObservationRow({ observation, onRemove }) {
  return (
    <div className="annrow">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>{observation.child_name || "A child"}</strong>
          {observation.classroom_name && (
            <span className="muted" style={{ fontSize: 12 }}>
              {observation.classroom_name}
            </span>
          )}
          <span className="muted" style={{ fontSize: 12 }}>
            {when(observation.observed_at)}
          </span>
        </div>

        <p style={{ margin: "4px 0 0" }}>{observation.note}</p>

        {observation.next_step && (
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>
            <Icon name="arrowRight" size={13} /> Next: {observation.next_step}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginTop: 6,
            alignItems: "center",
          }}
        >
          {(observation.areas || []).map((a) => (
            <Tag key={a} tone="grey">
              {AREA_SHORT[a] || a}
            </Tag>
          ))}
          {observation.observed_by?.name && (
            <span className="muted" style={{ fontSize: 12 }}>
              by {observation.observed_by.name}
            </span>
          )}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <Btn variant="outline" size="sm" icon="trash" onClick={onRemove}>
          Remove
        </Btn>
      </div>
    </div>
  );
}
