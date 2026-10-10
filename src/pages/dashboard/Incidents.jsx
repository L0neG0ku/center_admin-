import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Empty,
  PageHead,
  Panel,
  Select,
  StatCard,
  Tabs,
  Tag,
} from "../../components/dash/ui.jsx";
import { Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import * as api from "../../api/endpoints.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * The centre's incident book, from `GET /daycares/me/incidents`.
 *
 * Three rules from the API shape this page, and none of them is a UI choice:
 *
 *  1. **There is no delete, for anyone.** No route exists, and the table has
 *     no soft-delete column. A centre that can delete an incident can hide an
 *     injury, so the only action here is to sign one off.
 *  2. **Signing off freezes it.** After that the caretaker who filed it can no
 *     longer edit, which is what makes the signature mean anything — so the
 *     confirm step says that rather than assuming it is obvious.
 *  3. **A SERIOUS incident is refused sign-off while the record says nobody
 *     told the parent** (`409 PARENT_NOT_INFORMED`). The owner can satisfy it
 *     here by stating when they told the family themselves, which is the
 *     deadlock escape for a caretaker who has gone home.
 */

const SEVERITY_TONE = { MINOR: "green", MODERATE: "amber", SERIOUS: "red" };
const SEVERITY_LABEL = {
  MINOR: "Minor",
  MODERATE: "Needs watching",
  SERIOUS: "Serious",
};
const KIND_LABEL = {
  INJURY: "Injury",
  ILLNESS: "Illness",
  ALLERGIC_REACTION: "Allergic reaction",
  BEHAVIOUR: "Behaviour",
  MISSING_ITEM: "Missing item",
  OTHER: "Other",
};

function when(value) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

export default function Incidents() {
  const toast = useToast();
  const [tab, setTab] = useState("open");
  const [severity, setSeverity] = useState("");
  const [reviewing, setReviewing] = useState(null);

  const listCall = useResource(
    (signal) =>
      api.listIncidents(
        {
          per_page: 100,
          status: tab === "open" ? "REPORTED" : tab === "signed" ? "REVIEWED" : "",
          severity,
        },
        { signal }
      ),
    [tab, severity]
  );

  const incidents = useMemo(() => listCall.data || [], [listCall.data]);
  const review = useAction((id, payload) => api.reviewIncident(id, payload));

  const counts = useMemo(() => {
    const open = incidents.filter((i) => i.status === "REPORTED");
    return {
      open: open.length,
      serious: open.filter((i) => i.severity === "SERIOUS").length,
      blocked: open.filter(
        (i) => i.severity === "SERIOUS" && !i.parent_informed_at
      ).length,
    };
  }, [incidents]);

  async function handleReview(payload) {
    try {
      await review.run(reviewing.id, payload);
      setReviewing(null);
      listCall.reload();
      toast.show("Signed off.");
    } catch (error) {
      toast.show(error?.message || "Could not sign that off.", "error");
    }
  }

  return (
    <>
      <PageHead
        title="Incidents"
        sub="Every report filed at your centre. Nothing here can be deleted."
      />

      <div className="stats" style={{ marginBottom: 18 }}>
        <StatCard
          icon="alertTriangle"
          tone="amber"
          label="Awaiting your sign-off"
          value={counts.open}
        />
        <StatCard
          icon="alertCircle"
          tone="red"
          label="Serious, still open"
          value={counts.serious}
        />
        <StatCard
          icon="phone"
          tone="red"
          label="Blocked: parent not told"
          value={counts.blocked}
        />
      </div>

      {counts.blocked > 0 && (
        <p
          className="note-box"
          style={{ marginBottom: 16, borderColor: "var(--danger)" }}
        >
          <Icon name="alertTriangle" size={15} />{" "}
          <strong>
            {counts.blocked === 1
              ? "One serious report cannot be signed off"
              : `${counts.blocked} serious reports cannot be signed off`}
          </strong>{" "}
          — the record does not show the parent was told. Record when you or a
          caretaker informed them.
        </p>
      )}

      <Panel
        title="Reports"
        tools={
          <Select
            value={severity}
            onChange={setSeverity}
            placeholder="Any severity"
            options={[
              { value: "", label: "Any severity" },
              { value: "SERIOUS", label: "Serious" },
              { value: "MODERATE", label: "Needs watching" },
              { value: "MINOR", label: "Minor" },
            ]}
          />
        }
      >
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "open", label: "Awaiting sign-off", count: counts.open },
            { id: "signed", label: "Signed off" },
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
        ) : incidents.length === 0 ? (
          <Empty
            icon="shieldCheck"
            title={tab === "open" ? "Nothing waiting" : "No reports"}
            body={
              tab === "open"
                ? "Every report has been signed off."
                : "Caretakers file these from the app when something happens."
            }
          />
        ) : (
          <div className="annlist">
            {incidents.map((incident) => (
              <IncidentRow
                key={incident.id}
                incident={incident}
                onReview={() => setReviewing(incident)}
              />
            ))}
          </div>
        )}
      </Panel>

      {reviewing && (
        <ReviewModal
          incident={reviewing}
          busy={review.busy}
          onClose={() => setReviewing(null)}
          onSubmit={handleReview}
        />
      )}
    </>
  );
}

function IncidentRow({ incident, onReview }) {
  const blocked =
    incident.severity === "SERIOUS" &&
    !incident.parent_informed_at &&
    incident.status === "REPORTED";

  return (
    <article
      className="annrow"
      style={blocked ? { borderColor: "var(--danger)" } : undefined}
    >
      <div className="annrow__main">
        <div className="annrow__head">
          <strong>{incident.child_name || "A child"}</strong>
          <Tag tone={SEVERITY_TONE[incident.severity] || "grey"}>
            {SEVERITY_LABEL[incident.severity] || incident.severity}
          </Tag>
          <Tag tone="grey">{KIND_LABEL[incident.kind] || incident.kind}</Tag>
          {incident.medical_attention_required && (
            <Tag tone="red">Needed a doctor</Tag>
          )}
        </div>
        <p className="annrow__body">{incident.description}</p>
        <p className="annrow__meta">
          {when(incident.occurred_at)}
          {incident.classroom_name && ` · ${incident.classroom_name}`}
          {incident.reported_by?.name && ` · filed by ${incident.reported_by.name}`}
          {incident.location && ` · ${incident.location}`}
        </p>
        <p className="annrow__meta" style={{ marginTop: 4 }}>
          <strong>What was done:</strong> {incident.action_taken}
        </p>
      </div>

      <div className="annrow__side">
        {incident.status === "REVIEWED" ? (
          <>
            <strong>Signed off</strong>
            <p className="annrow__meta">
              {incident.reviewed_by?.name}
              {incident.reviewed_at && ` · ${when(incident.reviewed_at)}`}
            </p>
            {incident.review_note && (
              <p className="annrow__meta">{incident.review_note}</p>
            )}
          </>
        ) : (
          <>
            <strong>{blocked ? "Parent not told" : "Awaiting sign-off"}</strong>
            <p className="annrow__meta" style={{ marginBottom: 8 }}>
              {incident.parent_informed_at
                ? `Parent told ${when(incident.parent_informed_at)}`
                : "No record of the parent being told."}
            </p>
            <div className="annrow__actions">
              <button type="button" onClick={onReview}>
                Review and sign off
              </button>
            </div>
          </>
        )}
        {incident.parent_acknowledged_at && (
          <p className="annrow__meta">
            Parent read it {when(incident.parent_acknowledged_at)}
          </p>
        )}
      </div>
    </article>
  );
}

function ReviewModal({ incident, busy, onClose, onSubmit }) {
  const needsParent =
    incident.severity === "SERIOUS" && !incident.parent_informed_at;

  const [note, setNote] = useState("");
  const [informed, setInformed] = useState(needsParent);
  const [method, setMethod] = useState("Phone call");

  return (
    <Modal
      title="Sign off this report"
      sub="After this the caretaker can no longer edit it."
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            icon="checkCircle"
            disabled={busy || (needsParent && !informed)}
            onClick={() =>
              onSubmit({
                review_note: note.trim() || null,
                parent_informed_at: informed
                  ? new Date().toISOString()
                  : null,
                parent_informed_method: informed ? method : null,
              })
            }
          >
            {busy ? "Signing off..." : "Sign off"}
          </Btn>
        </>
      }
    >
      <div>
        <p className="note-box" style={{ marginBottom: 14 }}>
          <strong>{incident.child_name}</strong> · {when(incident.occurred_at)}
          <br />
          {incident.description}
        </p>

        {needsParent && (
          <div
            className="note-box"
            style={{ marginBottom: 14, borderColor: "var(--danger)" }}
          >
            <Icon name="alertTriangle" size={15} />{" "}
            <strong>This is a serious incident.</strong> It cannot be signed off
            until the record shows the family was told. Confirm below if you or
            a caretaker has spoken to them.
          </div>
        )}

        <label className="dfield">
          <span>
            <input
              type="checkbox"
              checked={informed}
              onChange={(event) => setInformed(event.target.checked)}
            />{" "}
            The parent has been told
          </span>
        </label>

        {informed && (
          <label className="dfield">
            <span>How</span>
            <Select
              value={method}
              onChange={setMethod}
              options={[
                { value: "Phone call", label: "Phone call" },
                { value: "In person at pickup", label: "In person at pickup" },
                { value: "Message", label: "Message" },
              ]}
            />
          </label>
        )}

        <label className="dfield">
          <span>Note (optional)</span>
          <textarea
            value={note}
            rows={4}
            maxLength={4000}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Spoke to the mother at pickup. Happy with how it was handled."
          />
        </label>
      </div>
    </Modal>
  );
}
