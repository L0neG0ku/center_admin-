import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Empty,
  PageHead,
  Panel,
  Search,
  StatCard,
  Tag,
} from "../../components/dash/ui.jsx";
import * as api from "../../api/endpoints.js";
import { useResource } from "../../api/useResource.js";

/**
 * The medicine round, as the owner reads it.
 *
 * Read-only, deliberately. Doses are recorded by the person who gave the
 * medicine, from the app, in the room — an owner filling one in at a desk
 * would be recording something they did not do, and the record carries a name.
 *
 * Three things about the record shape this page:
 *
 *  1. **Nothing here can be deleted.** No route exists and there is no
 *     soft-delete column, for the same reason an incident has none: a centre
 *     that can remove a medication record can remove the evidence of a
 *     mistake. `editable` says whether the twelve-hour correction window is
 *     still open on a row.
 *  2. **Refused and not-given matter more than given.** They are what a
 *     parent will ask about, so they are counted separately and surfaced
 *     above the day's list rather than mixed into it.
 *  3. **A missing row means nobody wrote one down.** It never means a dose was
 *     not given, so nothing on this page renders an absence as a negative.
 */

const STATUS = {
  GIVEN: { label: "Given", tone: "green", icon: "checkCircle" },
  REFUSED: { label: "Refused", tone: "amber", icon: "minusCircle" },
  OMITTED: { label: "Not given", tone: "grey", icon: "xCircle" },
};

const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

/** A time on the centre's clock, not the reader's — see DailyCare. */
const timeLabel = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : "";

export default function Medicine() {
  const [date, setDate] = useState(() => isoDate(new Date()));
  const [query, setQuery] = useState("");

  const listCall = useResource(
    (signal) => api.listDoses({ day: date }, { signal }),
    [date]
  );

  const doses = useMemo(() => listCall.data || [], [listCall.data]);

  const counts = useMemo(
    () => ({
      given: doses.filter((d) => d.status === "GIVEN").length,
      refused: doses.filter((d) => d.status === "REFUSED").length,
      omitted: doses.filter((d) => d.status === "OMITTED").length,
    }),
    [doses]
  );

  const needsAttention = useMemo(
    () => doses.filter((d) => d.status !== "GIVEN"),
    [doses]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return doses;
    return doses.filter(
      (d) =>
        (d.child_name || "").toLowerCase().includes(needle) ||
        (d.medication_name || "").toLowerCase().includes(needle)
    );
  }, [doses, query]);

  return (
    <>
      <PageHead
        title="Medicine"
        sub="What was given, by whom, and when. Recorded in the room, not here."
      />

      <div className="stats" style={{ marginBottom: 18 }}>
        <StatCard icon="checkCircle" tone="green" label="Given" value={counts.given} />
        <StatCard
          icon="minusCircle"
          tone={counts.refused ? "amber" : "grey"}
          label="Refused"
          value={counts.refused}
        />
        <StatCard
          icon="xCircle"
          tone={counts.omitted ? "amber" : "grey"}
          label="Not given"
          value={counts.omitted}
        />
      </div>

      {needsAttention.length > 0 && (
        <p className="note-box" style={{ marginBottom: 16, borderColor: "var(--warning)" }}>
          <Icon name="alertCircle" size={15} />{" "}
          <strong>
            {needsAttention.length === 1
              ? "One dose was not taken"
              : `${needsAttention.length} doses were not taken`}
          </strong>{" "}
          — a parent is likely to ask. The reason your caretaker recorded is on
          each row.
        </p>
      )}

      <Panel
        title="Doses"
        tools={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="date"
              value={date}
              max={isoDate(new Date())}
              onChange={(e) => setDate(e.target.value)}
            />
            <Search
              value={query}
              onChange={setQuery}
              placeholder="Child or medicine..."
            />
          </div>
        }
      >
        {listCall.loading ? (
          <p className="note-box">Loading the round…</p>
        ) : listCall.error ? (
          <p className="note-box" style={{ borderColor: "var(--danger)" }}>
            {listCall.error.message}{" "}
            <button type="button" onClick={listCall.reload}>
              Try again
            </button>
          </p>
        ) : filtered.length === 0 ? (
          <Empty
            icon="heart"
            title={query ? "No match" : "Nothing recorded"}
            /* Said as an absence of a record, never as an absence of a dose. */
            body={
              query
                ? "No dose on this day matches that."
                : "No doses were written down on this day. If a child is on medication, ask the room."
            }
          />
        ) : (
          <div className="annlist">
            {filtered.map((dose) => (
              <DoseRow key={dose.id} dose={dose} />
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function DoseRow({ dose }) {
  const status = STATUS[dose.status] || STATUS.GIVEN;

  return (
    <div className="annrow">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>{dose.child_name || "A child"}</strong>
          <Tag tone={status.tone} dot>
            {status.label}
          </Tag>
          <span className="muted" style={{ fontSize: 12 }}>
            {timeLabel(dose.administered_at)}
          </span>
        </div>

        <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
          {dose.medication_name || "Medication"}
          {/* Only when it differed from the prescription — repeating the
              standing dosage on every row hides the one that did not. */}
          {dose.dose_given ? ` · ${dose.dose_given}` : ""}
        </p>

        {dose.reason && (
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>
            <Icon name="alertCircle" size={13} /> {dose.reason}
          </p>
        )}
        {dose.note && (
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
            {dose.note}
          </p>
        )}
      </div>

      <div style={{ textAlign: "right", flexShrink: 0, fontSize: 12 }}>
        <div className="muted">{dose.given_by?.name || "—"}</div>
        {/* The server's flag, not a window timed here. A row that says frozen
            must not quietly turn out to be editable. */}
        <div className="muted">
          {dose.editable ? "correctable" : "frozen"}
        </div>
      </div>
    </div>
  );
}
