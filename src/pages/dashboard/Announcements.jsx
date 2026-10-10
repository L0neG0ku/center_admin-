import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Empty,
  PageHead,
  Panel,
  Select,
  StatCard,
  Tag,
} from "../../components/dash/ui.jsx";
import { Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import * as api from "../../api/endpoints.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * Announcements, from `GET /daycares/me/announcements`.
 *
 * The number that makes this page worth opening twice is "read by 96 of 128".
 * Both halves are facts about the moment it was sent: the backend resolves the
 * audience into a stored list of people at send time, so the denominator does
 * not drift as children join and leave. A recount against today's roster would
 * make "read by 96 of 131" appear for a message only 128 people ever got.
 *
 * WHAT IS NOT HERE, because the API has none of it: scheduling for later,
 * drafts, attachments, per-recipient delivery receipts, and edit-after-send.
 * Withdrawing is the only way to take something back, and it deliberately
 * leaves the record — a parent who already acted on "closed tomorrow"
 * deserves the centre to still have what it told them.
 */

const KINDS = [
  { value: "NOTICE", label: "Notice" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "EVENT", label: "Event" },
  { value: "EMERGENCY", label: "Emergency" },
];

const KIND_TONE = {
  NOTICE: "brand",
  HOLIDAY: "amber",
  EVENT: "green",
  EMERGENCY: "red",
};

function newClientId() {
  return crypto.randomUUID();
}

export default function Announcements() {
  const toast = useToast();
  const [composing, setComposing] = useState(false);
  const [includeWithdrawn, setIncludeWithdrawn] = useState(false);

  const listCall = useResource(
    (signal) =>
      api.listAnnouncements(
        { per_page: 50, include_withdrawn: includeWithdrawn },
        { signal }
      ),
    [includeWithdrawn]
  );
  const roomsCall = useResource((signal) => api.listClassrooms({ signal }), []);

  const announcements = useMemo(() => listCall.data || [], [listCall.data]);
  const rooms = useMemo(() => roomsCall.data || [], [roomsCall.data]);

  const send = useAction((payload) => api.sendAnnouncement(payload));
  const pin = useAction((id, on) => api.pinAnnouncement(id, on));
  const withdraw = useAction((id) => api.withdrawAnnouncement(id));

  const totals = useMemo(() => {
    const live = announcements.filter((item) => !item.withdrawn_at);
    const recipients = live.reduce(
      (sum, item) => sum + (item.recipient_count || 0),
      0
    );
    const reads = live.reduce((sum, item) => sum + (item.read_count || 0), 0);
    return { sent: live.length, recipients, reads };
  }, [announcements]);

  async function handleSend(form) {
    try {
      await send.run(form);
      setComposing(false);
      listCall.reload();
      toast.show("Announcement sent.");
    } catch (error) {
      toast.show(error?.message || "Could not send that.", "error");
    }
  }

  async function handlePin(item) {
    try {
      await pin.run(item.id, !item.is_pinned);
      listCall.reload();
    } catch (error) {
      toast.show(error?.message || "Could not pin that.", "error");
    }
  }

  async function handleWithdraw(item) {
    if (
      !window.confirm(
        `Withdraw "${item.title}"? It leaves every parent's feed. The record ` +
          `of having sent it stays.`
      )
    ) {
      return;
    }
    try {
      await withdraw.run(item.id);
      listCall.reload();
      toast.show("Withdrawn.");
    } catch (error) {
      toast.show(error?.message || "Could not withdraw that.", "error");
    }
  }

  return (
    <>
      <PageHead
        title="Announcements"
        sub="What you have told families, and who has read it."
      >
        <Btn icon="plus" onClick={() => setComposing(true)}>
          New announcement
        </Btn>
      </PageHead>

      <div className="stats" style={{ marginBottom: 18 }}>
        <StatCard icon="megaphone" label="Sent" value={totals.sent} />
        <StatCard
          icon="users"
          tone="brand"
          label="People reached"
          value={totals.recipients}
        />
        <StatCard
          icon="checkSquare"
          tone="green"
          label="Reads"
          value={totals.reads}
        />
      </div>

      <Panel
        title="Sent"
        tools={
          <label style={{ cursor: "pointer", fontSize: 13 }}>
            <input
              type="checkbox"
              checked={includeWithdrawn}
              onChange={(event) => setIncludeWithdrawn(event.target.checked)}
            />{" "}
            Show withdrawn
          </label>
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
        ) : announcements.length === 0 ? (
          <Empty
            icon="megaphone"
            title="Nothing sent yet"
            body="Closures, holidays and reminders all land in every parent's app."
          />
        ) : (
          <div className="annlist">
            {announcements.map((item) => (
              <AnnouncementRow
                key={item.id}
                item={item}
                busy={pin.busy || withdraw.busy}
                onPin={() => handlePin(item)}
                onWithdraw={() => handleWithdraw(item)}
              />
            ))}
          </div>
        )}
      </Panel>

      {composing && (
        <Compose
          rooms={rooms}
          busy={send.busy}
          onClose={() => setComposing(false)}
          onSend={handleSend}
        />
      )}
    </>
  );
}

function AnnouncementRow({ item, busy, onPin, onWithdraw }) {
  const total = item.recipient_count || 0;
  const read = item.read_count || 0;
  const percent = total ? Math.round((read / total) * 100) : 0;

  return (
    <article
      className="annrow"
      style={
        item.withdrawn_at
          ? { opacity: 0.6 }
          : item.kind === "EMERGENCY"
            ? { borderColor: "var(--danger)" }
            : undefined
      }
    >
      <div className="annrow__main">
        <div className="annrow__head">
          {item.is_pinned && <Icon name="star" size={14} />}
          <strong>{item.title}</strong>
          <Tag tone={KIND_TONE[item.kind] || "grey"}>
            {KINDS.find((k) => k.value === item.kind)?.label || item.kind}
          </Tag>
          {item.withdrawn_at && <Tag tone="grey">Withdrawn</Tag>}
        </div>
        <p className="annrow__body">{item.body}</p>
        <p className="annrow__meta">
          {new Date(item.published_at).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Kolkata",
          })}
          {" · "}
          {item.audience === "CLASSROOM"
            ? item.classroom_name || "One room"
            : item.audience === "ALL_STAFF"
              ? "Staff"
              : "All parents"}
          {item.author && ` · ${item.author.name}`}
        </p>
      </div>

      <div className="annrow__side">
        {/* Zero recipients is said rather than shown as 0%: it means nobody
            was in the audience, usually a room whose parents have not joined,
            which is a different problem from nobody reading it. */}
        <strong>
          {total === 0 ? "No recipients" : `Read by ${read} of ${total}`}
        </strong>
        {total > 0 && (
          <div className="annrow__bar">
            <span style={{ width: `${percent}%` }} />
          </div>
        )}
        {!item.withdrawn_at && (
          <div className="annrow__actions">
            <button type="button" disabled={busy} onClick={onPin}>
              {item.is_pinned ? "Unpin" : "Pin"}
            </button>
            <button type="button" disabled={busy} onClick={onWithdraw}>
              Withdraw
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function Compose({ rooms, busy, onClose, onSend }) {
  const [kind, setKind] = useState("NOTICE");
  const [audience, setAudience] = useState("ALL_PARENTS");
  const [classroomId, setClassroomId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const valid =
    title.trim().length >= 3 &&
    body.trim().length > 0 &&
    (audience !== "CLASSROOM" || classroomId);

  return (
    <Modal
      title="New announcement"
      sub="It lands in every recipient's app straight away."
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            icon="send"
            disabled={!valid || busy}
            onClick={() =>
              onSend({
                client_id: newClientId(),
                kind,
                audience,
                classroom_id: audience === "CLASSROOM" ? classroomId : null,
                title: title.trim(),
                body: body.trim(),
              })
            }
          >
            {busy ? "Sending..." : "Send"}
          </Btn>
        </>
      }
    >
      <div>
        <label className="dfield">
          <span>Kind</span>
          <Select value={kind} onChange={setKind} options={KINDS} />
        </label>

        <label className="dfield">
          <span>Who gets it</span>
          <Select
            value={audience}
            onChange={setAudience}
            options={[
              { value: "ALL_PARENTS", label: "All parents" },
              { value: "CLASSROOM", label: "One room's parents" },
              { value: "ALL_STAFF", label: "All staff" },
            ]}
          />
        </label>

        {audience === "CLASSROOM" && (
          <label className="dfield">
            <span>Which room</span>
            <Select
              value={classroomId}
              onChange={setClassroomId}
              placeholder="Choose a room"
              options={rooms.map((room) => ({
                value: room.id,
                label: room.name,
              }))}
            />
          </label>
        )}

        <label className="dfield">
          <span>Title</span>
          <input
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Centre closed tomorrow"
          />
        </label>

        <label className="dfield">
          <span>Message</span>
          <textarea
            value={body}
            rows={6}
            maxLength={8000}
            onChange={(event) => setBody(event.target.value)}
            placeholder="A burst pipe in the kitchen. We will update you by 6pm."
          />
        </label>

        {kind === "EMERGENCY" && (
          <p className="note-box" style={{ borderColor: "var(--danger)" }}>
            <Icon name="alertTriangle" size={15} /> An emergency announcement
            goes to the top of every parent&apos;s feed, above anything pinned.
          </p>
        )}

      </div>
    </Modal>
  );
}
