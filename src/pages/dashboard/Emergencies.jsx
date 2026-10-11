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
import { Modal, Drawer } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import * as api from "../../api/endpoints.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * Emergency alerts: raising one, and working the list of families who have
 * not answered.
 *
 * This is the owner's operational screen during an incident, which is why it
 * does not look like Announcements even though both reach every parent:
 *
 *  1. **An alert has a lifecycle.** The all-clear is information families need
 *     as much as the alarm, it is required in words by the API, and it is
 *     pushed to their phones as hard as the alert was. "Resolved" with no
 *     words leaves a parent guessing whether their child is safe or the centre
 *     simply closed the ticket.
 *  2. **Acknowledgement is a deliberate tap in the parent's app, not a read
 *     receipt.** A read can come from a lock-screen preview. That is what
 *     makes `outstanding` a list worth acting on.
 *  3. **`outstanding` carries phone numbers**, because the next thing anyone
 *     does with a list of families who have not answered is ring it. The
 *     drawer below is built to be read down a phone call, not skimmed.
 *
 * A caretaker can raise an alert from the mobile app but cannot clear one.
 * That asymmetry is the backend's: a routine broadcast sent by mistake erodes
 * trust so it stays with the owner, but an evacuation delayed while somebody
 * finds the owner is dangerous.
 */

const KINDS = [
  { value: "EVACUATION", label: "Evacuation", hint: "We have left the building" },
  { value: "LOCKDOWN", label: "Lockdown", hint: "Nobody in or out" },
  { value: "CLOSURE", label: "Closing the centre", hint: "Collect your child" },
  { value: "MEDICAL", label: "Medical", hint: "A child needs urgent care" },
  { value: "OTHER", label: "Something else", hint: "Describe it in the message" },
];

const KIND_LABEL = Object.fromEntries(KINDS.map((k) => [k.value, k.label]));

function when(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function newClientId() {
  return crypto.randomUUID();
}

export default function Emergencies() {
  const toast = useToast();
  const [tab, setTab] = useState("active");
  const [raising, setRaising] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [resolving, setResolving] = useState(null);

  const listCall = useResource(
    (signal) =>
      api.listEmergencies({ active_only: tab === "active" }, { signal }),
    [tab]
  );

  const alerts = useMemo(() => listCall.data || [], [listCall.data]);
  const raise = useAction((payload) => api.raiseEmergency(payload));
  const resolve = useAction((id, text) => api.resolveEmergency(id, text));

  const live = useMemo(
    () => alerts.filter((a) => a.status === "ACTIVE"),
    [alerts]
  );

  /* The number that matters while something is running: how many families
     are still to be phoned. Summed across live alerts, because during a real
     evacuation there may be more than one. */
  const waiting = useMemo(
    () =>
      live.reduce(
        (total, a) => total + (a.recipient_count - a.acknowledged_count),
        0
      ),
    [live]
  );

  async function handleRaise(payload) {
    try {
      await raise.run(payload);
      setRaising(false);
      listCall.reload();
      toast.show("Alert sent to every family and all staff.");
    } catch (error) {
      /* Said as a failure. An owner who believes families have been told will
         stop trying other ways to tell them. */
      toast.show(error?.message || "The alert was NOT sent.", "error");
    }
  }

  async function handleResolve(text) {
    try {
      await resolve.run(resolving.id, text);
      setResolving(null);
      listCall.reload();
      toast.show("All-clear sent.");
    } catch (error) {
      toast.show(error?.message || "Could not send the all-clear.", "error");
    }
  }

  return (
    <>
      <PageHead
        title="Emergencies"
        sub="Reaches every guardian and all staff at once. Cannot be unsent."
      >
        <Btn icon="alertTriangle" onClick={() => setRaising(true)}>
          Raise an alert
        </Btn>
      </PageHead>

      <div className="stats" style={{ marginBottom: 18 }}>
        <StatCard
          icon="alertTriangle"
          tone={live.length ? "red" : "green"}
          label="Happening now"
          value={live.length}
        />
        <StatCard
          icon="phone"
          tone={waiting ? "red" : "green"}
          label="Families still to phone"
          value={waiting}
        />
        <StatCard
          icon="shieldCheck"
          tone="brand"
          label="Alerts on record"
          value={alerts.length}
        />
      </div>

      {live.length > 0 && (
        <p
          className="note-box"
          style={{ marginBottom: 16, borderColor: "var(--danger)" }}
        >
          <Icon name="alertTriangle" size={15} />{" "}
          <strong>
            {live.length === 1
              ? "An alert is still open"
              : `${live.length} alerts are still open`}
          </strong>{" "}
          — families keep seeing it on their phones until you send the
          all-clear.
        </p>
      )}

      <Panel title="Alerts">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "active", label: "Happening now", count: live.length },
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
        ) : alerts.length === 0 ? (
          <Empty
            icon="shieldCheck"
            title={tab === "active" ? "Nothing happening" : "No alerts"}
            body={
              tab === "active"
                ? "No alert is currently open at your centre."
                : "You and your caretakers can raise one from here or the app."
            }
          />
        ) : (
          <div className="annlist">
            {alerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onOpen={() => setOpenId(alert.id)}
                onResolve={() => setResolving(alert)}
              />
            ))}
          </div>
        )}
      </Panel>

      {raising && (
        <RaiseModal
          busy={raise.running}
          onClose={() => setRaising(false)}
          onSend={handleRaise}
        />
      )}

      {openId && (
        <AlertDrawer
          alertId={openId}
          onClose={() => setOpenId(null)}
          onResolve={(alert) => {
            setOpenId(null);
            setResolving(alert);
          }}
        />
      )}

      {resolving && (
        <ResolveModal
          alert={resolving}
          busy={resolve.running}
          onClose={() => setResolving(null)}
          onSend={handleResolve}
        />
      )}
    </>
  );
}

function AlertRow({ alert, onOpen, onResolve }) {
  const active = alert.status === "ACTIVE";
  const outstanding = alert.recipient_count - alert.acknowledged_count;

  return (
    <div className="annrow">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag tone={active ? "red" : "green"} dot>
            {active ? KIND_LABEL[alert.kind] || alert.kind : "Resolved"}
          </Tag>
          <span className="muted" style={{ fontSize: 12 }}>
            {when(alert.raised_at)}
            {alert.raised_by?.name ? ` · ${alert.raised_by.name}` : ""}
          </span>
        </div>

        {alert.action_required && (
          <p style={{ margin: "6px 0 0", fontWeight: 600 }}>
            {alert.action_required}
          </p>
        )}
        <p className="muted" style={{ margin: "4px 0 0" }}>
          {alert.message}
        </p>

        {!active && alert.resolution && (
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>
            <Icon name="checkCircle" size={13} /> All clear: {alert.resolution}
          </p>
        )}

        <p className="muted" style={{ margin: "6px 0 0", fontSize: 12 }}>
          {/* The honest fraction. The denominator was fixed when the alert
              went out, so this means the same thing every time it is read. */}
          {alert.acknowledged_count} of {alert.recipient_count} answered
          {active && outstanding > 0 && (
            <strong style={{ color: "var(--danger)" }}>
              {" "}
              · {outstanding} to phone
            </strong>
          )}
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Btn variant="outline" size="sm" icon="users" onClick={onOpen}>
          Who answered
        </Btn>
        {active && (
          <Btn variant="soft" size="sm" icon="checkCircle" onClick={onResolve}>
            Send all-clear
          </Btn>
        )}
      </div>
    </div>
  );
}

/** Raising one. Confirms in the same step rather than a second dialog — the
 *  message field is long enough that nobody arrives at the button by accident,
 *  and an extra click during an evacuation is a cost. */
function RaiseModal({ busy, onClose, onSend }) {
  const [kind, setKind] = useState("");
  const [message, setMessage] = useState("");
  const [action, setAction] = useState("");

  /* Minted once per composed alert, not per click: a double submit on a bad
     connection must replay, not raise a second alarm. */
  const [clientId] = useState(newClientId);

  const ready = kind && message.trim().length >= 15;

  return (
    <Modal
      title="Raise an emergency alert"
      sub="Every guardian and all staff, immediately. This cannot be unsent."
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant="danger"
            disabled={!ready || busy}
            onClick={() =>
              onSend({
                client_id: clientId,
                kind,
                message: message.trim(),
                ...(action.trim() ? { action_required: action.trim() } : {}),
              })
            }
          >
            {busy ? "Sending…" : "Send to everyone"}
          </Btn>
        </>
      }
    >
      <label className="dfield">
        <span>What is happening</span>
        <div style={{ display: "grid", gap: 6 }}>
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className="note-box"
              style={{
                textAlign: "left",
                cursor: "pointer",
                borderColor:
                  kind === k.value ? "var(--danger)" : "var(--line)",
                background: kind === k.value ? "var(--danger-soft)" : "transparent",
              }}
            >
              <strong>{k.label}</strong>
              <span className="muted"> — {k.hint}</span>
            </button>
          ))}
        </div>
      </label>

      <label className="dfield">
        <span>What families need to know</span>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="We have evacuated to the park next door. All children are accounted for and safe."
        />
        <small className="muted">
          {/* The rule said before it is enforced, rather than as a rejection
              afterwards. A parent reads this as a push notification. */}
          At least a sentence — this is what appears on their phone.
        </small>
      </label>

      <label className="dfield">
        <span>What should they do? (optional)</span>
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Collect your child from the park gate on Mill Road."
        />
        <small className="muted">
          Shown first and largest on their phone, if you add it.
        </small>
      </label>
    </Modal>
  );
}

/** Who has answered, and who to phone.
 *
 *  Outstanding comes first and keeps its phone numbers. This panel is meant to
 *  be worked down during a phone call, so the order is the server's (by name)
 *  and does not change between reloads. */
function AlertDrawer({ alertId, onClose, onResolve }) {
  const call = useResource((signal) => api.getEmergency(alertId, { signal }), [
    alertId,
  ]);
  const alert = call.data;

  return (
    <Drawer
      title="Who has answered"
      sub={alert ? KIND_LABEL[alert.kind] || alert.kind : ""}
      onClose={onClose}
      wide
      footer={
        alert?.status === "ACTIVE" ? (
          <Btn icon="checkCircle" onClick={() => onResolve(alert)}>
            Send all-clear
          </Btn>
        ) : null
      }
    >
      {call.loading ? (
        <p className="note-box">Loading…</p>
      ) : call.error ? (
        <p className="note-box" style={{ borderColor: "var(--danger)" }}>
          {call.error.message}{" "}
          <button type="button" onClick={call.reload}>
            Try again
          </button>
        </p>
      ) : !alert ? null : (
        <>
          <p className="note-box" style={{ marginBottom: 14 }}>
            {alert.action_required && (
              <>
                <strong>{alert.action_required}</strong>
                <br />
              </>
            )}
            {alert.message}
            <br />
            <span className="muted" style={{ fontSize: 12 }}>
              Sent {when(alert.raised_at)}
              {alert.raised_by?.name ? ` by ${alert.raised_by.name}` : ""}
            </span>
          </p>

          <Panel
            title={`Still to reach (${alert.outstanding?.length || 0})`}
            sub="Acknowledging is a deliberate tap in their app, so these people have not confirmed they have seen it."
          >
            {!alert.outstanding?.length ? (
              <Empty
                icon="checkCircle"
                title="Everyone has answered"
                body="Every guardian and member of staff has confirmed they saw it."
              />
            ) : (
              <div className="annlist">
                {alert.outstanding.map((person) => (
                  <div className="annrow" key={person.user_id}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{person.name || "Guardian"}</strong>
                      {person.child_name && (
                        <span className="muted"> · {person.child_name}</span>
                      )}
                    </div>
                    {/* A tel: link, not plain text. The point of this list is
                        that somebody is phoning down it. */}
                    {person.phone ? (
                      <a
                        href={`tel:${person.phone}`}
                        style={{ fontWeight: 600, whiteSpace: "nowrap" }}
                      >
                        <Icon name="phone" size={13} /> {person.phone}
                      </a>
                    ) : (
                      <span className="muted">No number on file</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title={`Answered (${alert.acknowledged?.length || 0})`}>
            {!alert.acknowledged?.length ? (
              <Empty
                icon="clock"
                title="Nobody yet"
                body="This updates as families confirm in the app."
              />
            ) : (
              <div className="annlist">
                {alert.acknowledged.map((person) => (
                  <div className="annrow" key={person.user_id}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{person.name || "Guardian"}</strong>
                      {person.child_name && (
                        <span className="muted"> · {person.child_name}</span>
                      )}
                    </div>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {when(person.acknowledged_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </Drawer>
  );
}

/** The all-clear. Text required, by the API and for a reason. */
function ResolveModal({ alert, busy, onClose, onSend }) {
  const [text, setText] = useState("");
  const ready = text.trim().length >= 5;
  const outstanding = alert.recipient_count - alert.acknowledged_count;

  return (
    <Modal
      title="Send the all-clear"
      sub="Goes to everyone who got the alert, pushed as hard as the alert was."
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn disabled={!ready || busy} onClick={() => onSend(text.trim())}>
            {busy ? "Sending…" : "Send all-clear"}
          </Btn>
        </>
      }
    >
      {outstanding > 0 && (
        <p className="note-box" style={{ borderColor: "var(--warning)" }}>
          <Icon name="alertCircle" size={14} /> {outstanding}{" "}
          {outstanding === 1 ? "family has" : "families have"} not acknowledged
          the alert. They will receive this all-clear too — it does not replace
          phoning them.
        </p>
      )}

      <label className="dfield">
        <span>What happened, and that it is over</span>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="All children are back inside and the fire service has left. Normal pickup from 4pm."
        />
        <small className="muted">
          {/* Required by the API, and this is why. */}
          Required. A family who got "evacuate" and then a bare "resolved" is
          left guessing whether their child is safe.
        </small>
      </label>
    </Modal>
  );
}
