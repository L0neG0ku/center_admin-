import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Empty,
  PageHead,
  Panel,
  StatCard,
  Tabs,
  Tag,
} from "../../components/dash/ui.jsx";
import { Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import * as api from "../../api/endpoints.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * Meetings between the centre and its families.
 *
 * This and the parent's screen are two views of one record, because the six
 * endpoints behind them are role-agnostic — the backend works out which side
 * the caller is on. Four rules follow from that and none is a UI choice:
 *
 *  1. **Only the side being waited on may agree.** Confirming your own
 *     proposal is `409 NOT_YOUR_TURN`. So "Agree" appears only where the
 *     server says `awaiting_me`, never inferred from the status here.
 *  2. **A counter-proposal moves the same record.** There is no list of
 *     candidate times to reconcile; both sides always look at one time.
 *  3. **Only the centre may close one**, and only once confirmed. The outcome
 *     written here is what the family reads afterwards, and is often the only
 *     written record of what was agreed.
 *  4. **Cancelling needs a reason.** A meeting that silently disappears tells
 *     a family nothing about whether another time is coming.
 *
 * There is deliberately no availability calendar. The centre does not publish
 * one anywhere in Kribble, so showing a grid of "free" slots would be
 * inventing it.
 */

const MODES = [
  { value: "IN_PERSON", label: "In person" },
  { value: "PHONE", label: "Phone call" },
  { value: "VIDEO", label: "Video call" },
];
const MODE_LABEL = Object.fromEntries(MODES.map((m) => [m.value, m.label]));

const STATUS_TONE = {
  REQUESTED: "amber",
  CONFIRMED: "green",
  CANCELLED: "grey",
  COMPLETED: "blue",
};

function when(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

/** A datetime-local value for the centre's own clock.
 *
 *  The input works in the browser's timezone, which for a centre in Pune is
 *  the same thing — but an owner travelling would otherwise propose a time in
 *  whatever zone their laptop is set to, and the family would read it in
 *  theirs. So the value is built from and parsed back through Asia/Kolkata
 *  explicitly. */
const CENTRE_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toLocalInput(iso) {
  const base = iso ? new Date(iso) : new Date(Date.now() + 86400000);
  return new Date(base.getTime() + CENTRE_OFFSET_MS).toISOString().slice(0, 16);
}

function fromLocalInput(value) {
  return new Date(new Date(`${value}Z`).getTime() - CENTRE_OFFSET_MS)
    .toISOString();
}

function statusLabel(meeting) {
  if (meeting.status === "REQUESTED") {
    return meeting.awaiting_me ? "Needs your answer" : "Waiting for the family";
  }
  return { CONFIRMED: "Agreed", CANCELLED: "Cancelled", COMPLETED: "Held" }[
    meeting.status
  ];
}

export default function Meetings() {
  const toast = useToast();
  const [tab, setTab] = useState("open");
  const [proposing, setProposing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [completing, setCompleting] = useState(null);

  const listCall = useResource(
    (signal) => api.listMeetings({ open_only: tab === "open" }, { signal }),
    [tab]
  );

  const meetings = useMemo(() => listCall.data || [], [listCall.data]);
  const confirm = useAction((id) => api.confirmMeeting(id));
  const propose = useAction((id, payload) => api.proposeMeetingTime(id, payload));
  const cancel = useAction((id, reason) => api.cancelMeeting(id, reason));
  const complete = useAction((id, outcome) => api.completeMeeting(id, outcome));

  const counts = useMemo(() => {
    const open = meetings.filter(
      (m) => m.status === "REQUESTED" || m.status === "CONFIRMED"
    );
    return {
      open: open.length,
      /* From the server's awaiting_me, so this number and the buttons on the
         rows can never disagree. */
      mine: open.filter((m) => m.awaiting_me).length,
      agreed: open.filter((m) => m.status === "CONFIRMED").length,
    };
  }, [meetings]);

  async function run(label, fn) {
    try {
      await fn();
      listCall.reload();
      toast.show(label);
    } catch (error) {
      toast.show(error?.message || "That did not go through.", "error");
    }
  }

  const waiting = meetings.filter(
    (m) => m.awaiting_me && (m.status === "REQUESTED" || m.status === "CONFIRMED")
  );
  const rest = meetings.filter((m) => !waiting.includes(m));

  return (
    <>
      <PageHead
        title="Meetings"
        sub="Conversations your families have asked for, and the ones you have."
      />

      <div className="stats" style={{ marginBottom: 18 }}>
        <StatCard
          icon="message"
          tone={counts.mine ? "amber" : "green"}
          label="Waiting on you"
          value={counts.mine}
        />
        <StatCard
          icon="calendar"
          tone="brand"
          label="Agreed and upcoming"
          value={counts.agreed}
        />
        <StatCard icon="users" tone="blue" label="Open" value={counts.open} />
      </div>

      {counts.mine > 0 && (
        <p className="note-box" style={{ marginBottom: 16 }}>
          <Icon name="message" size={15} />{" "}
          <strong>
            {counts.mine === 1
              ? "One family is waiting on you"
              : `${counts.mine} families are waiting on you`}
          </strong>{" "}
          — agree to the time they suggested, or offer another.
        </p>
      )}

      <Panel title="Meetings">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "open", label: "Open", count: counts.open },
            { id: "all", label: "All" },
          ]}
        />

        {listCall.loading ? (
          <p className="note-box">Loading…</p>
        ) : listCall.error ? (
          <p className="note-box" style={{ borderColor: "var(--danger)" }}>
            {listCall.error.message}{" "}
            <button type="button" onClick={listCall.reload}>
              Try again
            </button>
          </p>
        ) : meetings.length === 0 ? (
          <Empty
            icon="message"
            title={tab === "open" ? "Nothing open" : "No meetings"}
            body="Families ask for these from their app, and your caretakers can start one from theirs."
          />
        ) : (
          <div className="annlist">
            {[...waiting, ...rest].map((meeting) => (
              <MeetingRow
                key={meeting.id}
                meeting={meeting}
                busy={confirm.running}
                onConfirm={() =>
                  run("Agreed. The family can see it.", () =>
                    confirm.run(meeting.id)
                  )
                }
                onPropose={() => setProposing(meeting)}
                onCancel={() => setCancelling(meeting)}
                onComplete={() => setCompleting(meeting)}
              />
            ))}
          </div>
        )}
      </Panel>

      {proposing && (
        <ProposeModal
          meeting={proposing}
          busy={propose.running}
          onClose={() => setProposing(null)}
          onSend={async (payload) => {
            await run("Offered. The family will reply.", () =>
              propose.run(proposing.id, payload)
            );
            setProposing(null);
          }}
        />
      )}

      {cancelling && (
        <CancelModal
          busy={cancel.running}
          onClose={() => setCancelling(null)}
          onSend={async (reason) => {
            await run("Cancelled.", () => cancel.run(cancelling.id, reason));
            setCancelling(null);
          }}
        />
      )}

      {completing && (
        <CompleteModal
          busy={complete.running}
          onClose={() => setCompleting(null)}
          onSend={async (outcome) => {
            await run("Saved.", () => complete.run(completing.id, outcome));
            setCompleting(null);
          }}
        />
      )}
    </>
  );
}

function MeetingRow({
  meeting,
  busy,
  onConfirm,
  onPropose,
  onCancel,
  onComplete,
}) {
  const open = meeting.status === "REQUESTED" || meeting.status === "CONFIRMED";
  const needsMe = open && meeting.awaiting_me;

  return (
    <div
      className="annrow"
      style={needsMe ? { borderLeft: "3px solid var(--brand)" } : undefined}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>{meeting.subject}</strong>
          <Tag tone={STATUS_TONE[meeting.status]} dot>
            {statusLabel(meeting)}
          </Tag>
        </div>

        <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
          {meeting.child_name || "A child"}
          {meeting.classroom_name ? ` · ${meeting.classroom_name}` : ""}
          {" · "}
          {when(meeting.scheduled_for)}
          {" · "}
          {MODE_LABEL[meeting.mode] || meeting.mode}
        </p>

        {meeting.details && (
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {meeting.details}
          </p>
        )}
        {meeting.requested_by?.name && (
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
            Asked by {meeting.requested_by.name}
          </p>
        )}
        {meeting.cancelled_reason && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--danger)" }}>
            Cancelled: {meeting.cancelled_reason}
          </p>
        )}
        {meeting.outcome && (
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>
            <Icon name="checkCircle" size={13} /> Agreed: {meeting.outcome}
          </p>
        )}
      </div>

      {open && (
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          {/* Gated on the server's answer. Confirming a time you proposed is
              409 NOT_YOUR_TURN, so the button is simply not here. */}
          {needsMe && meeting.status === "REQUESTED" && (
            <Btn size="sm" disabled={busy} onClick={onConfirm}>
              Agree
            </Btn>
          )}
          <Btn variant="outline" size="sm" onClick={onPropose}>
            Another time
          </Btn>
          {meeting.status === "CONFIRMED" && (
            <Btn variant="outline" size="sm" icon="checkCircle" onClick={onComplete}>
              Mark as held
            </Btn>
          )}
          <Btn variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Btn>
        </div>
      )}
    </div>
  );
}

function ProposeModal({ meeting, busy, onClose, onSend }) {
  const [at, setAt] = useState(() => toLocalInput(meeting.scheduled_for));
  const [mode, setMode] = useState(meeting.mode);
  const [note, setNote] = useState("");

  /* The API refuses a past time — the inversion of every other timestamp rule
     in this product, where records describe what already happened. Checked
     here so the owner is not told after typing. */
  const future = at && new Date(fromLocalInput(at)) > new Date();

  return (
    <Modal
      title="Offer another time"
      sub="Replaces the time on this meeting and puts the answer back with the family."
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Back
          </Btn>
          <Btn
            disabled={!future || busy}
            onClick={() =>
              onSend({
                scheduled_for: fromLocalInput(at),
                mode,
                ...(note.trim() ? { note: note.trim() } : {}),
              })
            }
          >
            {busy ? "Sending…" : "Offer this time"}
          </Btn>
        </>
      }
    >
      <label className="dfield">
        <span>When</span>
        <input
          type="datetime-local"
          value={at}
          onChange={(e) => setAt(e.target.value)}
        />
        {at && !future && (
          <small style={{ color: "var(--danger)" }}>
            That time has passed. Pick a time in the future.
          </small>
        )}
      </label>

      <label className="dfield">
        <span>How</span>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <label className="dfield">
        <span>Note to the family (optional)</span>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Sorry, Thursday is a staff training day — would Friday work?"
        />
      </label>
    </Modal>
  );
}

function CancelModal({ busy, onClose, onSend }) {
  const [reason, setReason] = useState("");
  const ready = reason.trim().length >= 3;

  return (
    <Modal
      title="Cancel this meeting?"
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Keep it
          </Btn>
          <Btn variant="danger" disabled={!ready || busy} onClick={() => onSend(reason.trim())}>
            {busy ? "Cancelling…" : "Cancel meeting"}
          </Btn>
        </>
      }
    >
      <label className="dfield">
        <span>Why</span>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="We are short-staffed that afternoon — we will offer a new time."
        />
        <small className="muted">
          {/* Required by the API, and this is why. */}
          The family sees this, so they know whether to expect another time.
        </small>
      </label>
    </Modal>
  );
}

function CompleteModal({ busy, onClose, onSend }) {
  const [outcome, setOutcome] = useState("");

  return (
    <Modal
      title="Mark as held"
      sub="Only the centre can close a meeting."
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Back
          </Btn>
          <Btn disabled={busy} onClick={() => onSend(outcome.trim())}>
            {busy ? "Saving…" : "Save"}
          </Btn>
        </>
      }
    >
      <label className="dfield">
        <span>What was agreed</span>
        <textarea
          rows={4}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="Agreed to move him to the older room after Diwali, and to try a shorter nap."
        />
        <small className="muted">
          {/* Optional on the wire, worth filling. */}
          The family reads this afterwards. It is often the only written record
          of the conversation.
        </small>
      </label>
    </Modal>
  );
}
