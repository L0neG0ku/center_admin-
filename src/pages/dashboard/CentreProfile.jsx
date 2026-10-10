import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Empty,
  Fact,
  PageHead,
  Panel,
  Row,
  StatCard,
  Tabs,
  Tag,
} from "../../components/dash/ui.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import * as api from "../../api/endpoints.js";
import { useReference } from "../../api/useReference.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * The centre, from `GET /daycares/me` — the same record the signup flow fills.
 *
 * `DaycareOut` is rich, so most of this page is real: names, type, ownership,
 * address, hours, age groups, capacity, ratios, fees, curriculum, languages,
 * facilities, plus the uploaded photos and documents and the verification
 * timeline.
 *
 * WHAT CAME OUT, because nothing stores it: a rating and review count,
 * listing view counts, a "centre manager" separate from the owner, and the
 * licence table's expiry dates with an "Expiring soon — renew before expiry
 * to keep meals listed" warning. Documents have a status (PENDING / VERIFIED
 * / REJECTED) and a reviewer note; they have no expiry date, so an FSSAI
 * renewal countdown was invented and would have had an owner acting on a date
 * nobody recorded.
 *
 * Also removed from the verification timeline: "Staff background checks — 17
 * of 18 staff cleared". There is no employee verification pipeline, which is
 * the same fabricated claim the Staff page was making.
 */

const CENTRE_TYPE = {
  DAYCARE: "Daycare",
  PRESCHOOL: "Preschool",
  BOTH: "Preschool + Daycare",
};

const OWNERSHIP = { INDEPENDENT: "Independent", FRANCHISE: "Franchise" };

const DOC_LABEL = {
  PAN: "PAN card",
  BUSINESS_REGISTRATION: "Business registration",
  GST: "GST certificate",
  FSSAI: "FSSAI licence",
  FRANCHISE_AGREEMENT: "Franchise agreement",
  FIRE_NOC: "Fire safety NOC",
};

const DOC_TONE = { VERIFIED: "green", PENDING: "blue", REJECTED: "red" };
const DOC_STATUS = {
  VERIFIED: "Verified",
  PENDING: "With the review team",
  REJECTED: "Rejected",
};

const PHOTO_LABEL = {
  EXTERIOR: "Exterior / entrance",
  CLASSROOM: "Classrooms",
  PLAY: "Play area",
  WASHROOM: "Washrooms",
  KITCHEN: "Kitchen",
  NAP: "Nap room",
};

/**
 * `PATCH /daycares/me` is the signup flow's autosave and is LOCKED once a
 * centre leaves draft — `daycare_service.EDITABLE_STATUSES` is exactly these
 * three, and anything else gets a 409 DAYCARE_LOCKED. Every approved centre
 * is therefore read-only, which is most of them, so the page has to say so
 * rather than offering a Save button that always fails.
 */
const EDITABLE_STATUSES = new Set(["DRAFT", "CHANGES_REQUESTED", "REJECTED"]);

const STATUS_TONE = {
  PUBLISHED: "green",
  APPROVED: "green",
  IN_REVIEW: "blue",
  SUBMITTED: "blue",
  CHANGES_REQUESTED: "amber",
  DRAFT: "grey",
  REJECTED: "red",
  SUSPENDED: "red",
};

const dateLabel = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

/** `09:00:00` → `9:00 AM`. The API sends a plain time, not a timestamp. */
function clockLabel(value) {
  if (!value) return null;
  const [hourText, minute] = String(value).split(":");
  const hour24 = Number(hourText);
  if (Number.isNaN(hour24)) return value;
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour}:${minute ?? "00"} ${hour24 < 12 ? "AM" : "PM"}`;
}

/** Fees are stored in whole rupees on the centre record, not paise. */
const rupees = (value) =>
  value === null || value === undefined
    ? "—"
    : `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;

export default function CentreProfile() {
  const toast = useToast();
  const reference = useReference();
  const [tab, setTab] = useState("details");

  const centreCall = useResource((signal) => api.getMyDaycare({ signal }), []);
  const centre = centreCall.data;

  if (centreCall.loading) {
    return (
      <>
        <PageHead title="Centre profile" sub="Loading..." />
        <Panel>
          <Empty
            icon="building"
            title="Loading..."
            body="Fetching your centre."
          />
        </Panel>
      </>
    );
  }

  if (centreCall.error || !centre) {
    return (
      <>
        <PageHead title="Centre profile" />
        <Panel>
          <Empty
            icon="alertTriangle"
            title="Could not load your centre"
            body={centreCall.error?.message || "Please try again."}
            action={
              <Btn variant="outline" onClick={centreCall.reload}>
                Try again
              </Btn>
            }
          />
        </Panel>
      </>
    );
  }

  const address = [
    centre.address_line,
    centre.area,
    centre.city,
    centre.state,
    centre.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHead
        title={centre.display_name || centre.legal_name || "Your centre"}
        sub={`${centre.public_id}${centre.city ? ` · ${centre.city}` : ""}`}
      >
        <Tag tone={STATUS_TONE[centre.status] || "grey"} dot>
          {centre.is_published
            ? "Live"
            : (centre.status || "").replace(/_/g, " ")}
        </Tag>
      </PageHead>

      <div className="stats">
        <StatCard
          icon="users"
          tone="brand"
          label="Capacity"
          value={centre.capacity ?? "—"}
        />
        <StatCard
          icon="shieldCheck"
          tone={centre.verified_badge ? "green" : "amber"}
          label="Verified badge"
          value={centre.verified_badge ? "Issued" : "Not yet"}
        />
        <StatCard
          icon="calendar"
          tone="blue"
          label="On Kribble since"
          value={dateLabel(centre.created_at)}
        />
        <StatCard
          icon="clock"
          tone="grey"
          label="Hours"
          value={
            clockLabel(centre.open_time) && clockLabel(centre.close_time)
              ? `${clockLabel(centre.open_time)} – ${clockLabel(centre.close_time)}`
              : "Not set"
          }
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "details", label: "Centre details" },
            { id: "care", label: "Hours & care" },
            { id: "photos", label: "Photos" },
            { id: "docs", label: "Documents" },
            { id: "verification", label: "Verification" },
          ]}
        />
      </div>

      {tab === "details" ? (
        <DetailsTab
          centre={centre}
          address={address}
          editable={EDITABLE_STATUSES.has(centre.status)}
          onSaved={() => {
            centreCall.reload();
            toast("Centre details saved");
          }}
        />
      ) : null}

      {tab === "care" ? (
        <CareTab centre={centre} reference={reference} />
      ) : null}

      {tab === "photos" ? <PhotosTab /> : null}
      {tab === "docs" ? <DocumentsTab /> : null}
      {tab === "verification" ? <VerificationTab /> : null}
    </>
  );
}

/**
 * The editable identity fields.
 *
 * `PATCH /daycares/me` is the signup flow's autosave, so it accepts any
 * subset — only what changed is sent. The address and the legal name are NOT
 * editable here: they were verified by a physical inspection, and letting an
 * owner quietly change them afterwards would mean the verified badge no
 * longer refers to the place that was visited.
 */
function DetailsTab({ centre, address, editable, onSaved }) {
  const [draft, setDraft] = useState(null);

  const value = draft ?? {
    display_name: centre.display_name || "",
    email: centre.email || "",
    about: centre.about || "",
  };
  const dirty = draft !== null;

  const save = useAction(() =>
    api.patchMyDaycare({
      display_name: value.display_name.trim(),
      email: value.email.trim(),
      about: value.about.trim(),
    }),
  );

  return (
    <>
      <Panel
        title="Centre details"
        sub="What parents see on your listing"
        action={
          editable ? (
            <Btn
              icon="check"
              disabled={!dirty || save.busy}
              onClick={() =>
                save
                  .run()
                  .then(() => {
                    setDraft(null);
                    onSaved();
                  })
                  .catch(() => {})
              }
            >
              {save.busy ? "Saving..." : dirty ? "Save" : "Saved"}
            </Btn>
          ) : undefined
        }
      >
        {!editable ? (
          <>
            <div className="dgrid">
              <Fact label="Display name" value={centre.display_name} />
              <Fact label="Contact email" value={centre.email} />
            </div>
            <div style={{ marginTop: 14 }}>
              <Fact label="About" value={centre.about} />
            </div>
            <p className="note-box" style={{ marginTop: 16 }}>
              <Icon name="lock" size={15} /> Your centre is approved and live,
              so its listing is locked — these details were confirmed during
              verification. Contact support to change them.
            </p>
          </>
        ) : (
          <>
            <div className="dfield-2">
              <label className="dfield">
                <span>Display name</span>
                <input
                  value={value.display_name}
                  onChange={(event) =>
                    setDraft({ ...value, display_name: event.target.value })
                  }
                />
              </label>
              <label className="dfield">
                <span>Contact email</span>
                <input
                  value={value.email}
                  inputMode="email"
                  onChange={(event) =>
                    setDraft({ ...value, email: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="dfield" style={{ marginTop: 14 }}>
              <span>About your centre</span>
              <textarea
                rows={4}
                value={value.about}
                placeholder="What makes your centre a good place for a child"
                onChange={(event) =>
                  setDraft({ ...value, about: event.target.value })
                }
              />
            </label>
          </>
        )}
        {save.error ? (
          <p className="dfield__error">{save.error.message}</p>
        ) : null}
      </Panel>

      <Panel
        title="Verified details"
        sub="Confirmed during your inspection — contact support to change these"
      >
        <div className="dgrid">
          <Fact label="Legal name" value={centre.legal_name} />
          <Fact
            label="Centre type"
            value={CENTRE_TYPE[centre.centre_type] || centre.centre_type}
          />
          <Fact
            label="Ownership"
            value={
              centre.ownership === "FRANCHISE" && centre.franchise_brand
                ? `Franchise · ${centre.franchise_brand}`
                : OWNERSHIP[centre.ownership] || centre.ownership
            }
          />
          <Fact label="Owner" value={centre.owner_name} />
          <Fact
            label="Phone"
            value={
              centre.phone ? (
                <>
                  {centre.phone}{" "}
                  {centre.phone_verified ? (
                    <Tag tone="green">Verified</Tag>
                  ) : (
                    <Tag tone="amber">Unverified</Tag>
                  )}
                </>
              ) : null
            }
          />
          <Fact label="Centre ID" value={centre.public_id} />
        </div>
        <div style={{ marginTop: 14 }}>
          <Fact label="Address" value={address} />
        </div>
      </Panel>

      <Panel title="Fees" sub="As listed to parents">
        <Row label="Full day" value={rupees(centre.fee_full_day)} />
        <Row label="Half day" value={rupees(centre.fee_half_day)} />
        <Row label="Admission" value={rupees(centre.fee_admission)} />
        <Row label="GST" value={centre.gst_exempt ? "Exempt" : "Applicable"} />
        {/* There are no billing endpoints, so this is the listed price only —
            not what any family has actually been charged. */}
        <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
          These are your listed prices. Invoicing and collection are not part of
          Kribble yet.
        </p>
      </Panel>
    </>
  );
}

/** Hours, age groups, ratios and facilities — all from the centre record. */
function CareTab({ centre, reference }) {
  const workingDays = centre.working_days || [];
  const allDays = reference?.weekdays || [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const facilities = [
    { label: "Meals served", on: centre.meals_provided, icon: "utensils" },
    { label: "CCTV monitored", on: centre.cctv_available, icon: "shield" },
  ];

  return (
    <>
      <Panel title="Opening hours">
        {allDays.map((day) => {
          const open = workingDays.includes(day);
          return (
            <Row
              key={day}
              label={day}
              value={
                open ? (
                  `${clockLabel(centre.open_time) || "—"} – ${
                    clockLabel(centre.close_time) || "—"
                  }`
                ) : (
                  <span className="muted">Closed</span>
                )
              }
            />
          );
        })}
        {/* One pair of times for the whole week is what the record holds —
            there is no per-day schedule to show. */}
        <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
          Your centre has one opening and closing time, applied to every working
          day.
        </p>
      </Panel>

      <Panel title="Ages & groups">
        <Row
          label="Age groups"
          value={
            (centre.age_groups || []).length ? (
              <span className="nowrap">{centre.age_groups.join(", ")}</span>
            ) : (
              <span className="muted">Not set</span>
            )
          }
        />
        <Row label="Capacity" value={centre.capacity ?? "Not set"} />
        <Row
          label="Preschool slots"
          value={centre.preschool_slots || <span className="muted">—</span>}
        />
        <Row
          label="Teacher to child"
          value={
            centre.teacher_child_ratio
              ? `1 : ${centre.teacher_child_ratio}`
              : "Not set"
          }
        />
        <Row
          label="Caregiver to child"
          value={
            centre.caregiver_child_ratio
              ? `1 : ${centre.caregiver_child_ratio}`
              : "Not set"
          }
        />
      </Panel>

      <Panel title="Curriculum & languages">
        <Row
          label="Curriculum"
          value={
            (centre.curriculum || []).length
              ? centre.curriculum.join(", ")
              : "Not set"
          }
        />
        <Row
          label="Languages"
          value={
            (centre.primary_languages || []).length
              ? centre.primary_languages.join(", ")
              : "Not set"
          }
        />
      </Panel>

      <Panel
        title="Facilities"
        sub="Only what the centre record stores — these two are what parents filter on"
      >
        <div className="dchips">
          {facilities.map((item) => (
            <span
              key={item.label}
              className={`dchip ${item.on ? "is-on" : ""}`.trim()}
            >
              <Icon name={item.on ? "check" : "close"} size={13} /> {item.label}
            </span>
          ))}
        </div>
      </Panel>
    </>
  );
}

function PhotosTab() {
  const call = useResource((signal) => api.listPhotos({ signal }), []);
  // Memoised on `call.data` rather than on a `|| []` fallback, which would be
  // a new array on every render and defeat the memo below.
  const photos = useMemo(() => call.data || [], [call.data]);

  const byCategory = useMemo(() => {
    const groups = new Map();
    photos.forEach((photo) => {
      if (!groups.has(photo.category)) groups.set(photo.category, []);
      groups.get(photo.category).push(photo);
    });
    return [...groups.entries()];
  }, [photos]);

  if (call.loading) {
    return (
      <Panel title="Photos">
        <Empty icon="camera" title="Loading..." body="Fetching your photos." />
      </Panel>
    );
  }

  if (call.error) {
    return (
      <Panel title="Photos">
        <Empty
          icon="alertTriangle"
          title="Could not load your photos"
          body={call.error.message}
          action={
            <Btn variant="outline" onClick={call.reload}>
              Try again
            </Btn>
          }
        />
      </Panel>
    );
  }

  return (
    <Panel
      title="Photos"
      sub={`${photos.length} on your listing`}
      badge={{ label: `${byCategory.length} categories`, tone: "brand" }}
    >
      {photos.length === 0 ? (
        <Empty
          icon="camera"
          title="No photos yet"
          body="Photos were part of your application. Contact support to add more."
        />
      ) : (
        byCategory.map(([category, items]) => (
          <section className="dsec" key={category}>
            <h3>
              {PHOTO_LABEL[category] || category}{" "}
              <Tag tone="brand">{items.length}</Tag>
            </h3>
            <div className="photogrid">
              {items.map((photo) =>
                photo.download_url ? (
                  <img
                    key={photo.id}
                    src={photo.download_url}
                    alt={PHOTO_LABEL[category] || category}
                    className="photogrid__tile"
                    loading="lazy"
                  />
                ) : (
                  <span key={photo.id} className="photogrid__tile">
                    <Icon name="image" size={18} />
                  </span>
                ),
              )}
            </div>
            {items.some((photo) => photo.is_cover) ? (
              <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                One of these is your listing cover.
              </p>
            ) : null}
          </section>
        ))
      )}
    </Panel>
  );
}

/**
 * Uploaded documents and their review status.
 *
 * Status and a reviewer note are what the API stores. There is no expiry
 * date on a document, so the old "FSSAI expires in 24 days — renew to keep
 * meals listed" countdown is gone; it was invented, and an owner would have
 * acted on it.
 */
function DocumentsTab() {
  const call = useResource((signal) => api.listDocuments({ signal }), []);
  const documents = call.data || [];

  if (call.loading) {
    return (
      <Panel title="Documents">
        <Empty
          icon="fileText"
          title="Loading..."
          body="Fetching your documents."
        />
      </Panel>
    );
  }

  if (call.error) {
    return (
      <Panel title="Documents">
        <Empty
          icon="alertTriangle"
          title="Could not load your documents"
          body={call.error.message}
          action={
            <Btn variant="outline" onClick={call.reload}>
              Try again
            </Btn>
          }
        />
      </Panel>
    );
  }

  const rejected = documents.filter((doc) => doc.status === "REJECTED");

  return (
    <>
      {rejected.length > 0 ? (
        <p
          className="note-box"
          style={{ marginBottom: 16, borderColor: "var(--danger)" }}
        >
          <Icon name="alertTriangle" size={15} />{" "}
          {rejected.length === 1
            ? "One document was rejected"
            : `${rejected.length} documents were rejected`}{" "}
          — the reviewer&rsquo;s note is on each one below.
        </p>
      ) : null}

      <Panel title="Documents" sub={`${documents.length} on file`}>
        {documents.length === 0 ? (
          <Empty
            icon="fileText"
            title="No documents on file"
            body="Documents were part of your application."
          />
        ) : (
          documents.map((doc) => (
            <div className="drow" key={doc.id}>
              <span>
                {DOC_LABEL[doc.doc_type] || doc.doc_type}
                <br />
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {doc.file_name} · uploaded {dateLabel(doc.created_at)}
                  {doc.reviewer_note ? ` · ${doc.reviewer_note}` : ""}
                </span>
              </span>
              <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Tag tone={DOC_TONE[doc.status] || "grey"} dot>
                  {DOC_STATUS[doc.status] || doc.status}
                </Tag>
                {doc.download_url ? (
                  <a
                    className="dbtn dbtn--outline dbtn--sm"
                    href={doc.download_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                ) : null}
              </strong>
            </div>
          ))
        )}
      </Panel>
    </>
  );
}

/** The real verification timeline, from the waiting-room endpoint. */
function VerificationTab() {
  const call = useResource(
    (signal) => api.getVerificationStatus({ signal }),
    [],
  );
  const status = call.data;

  if (call.loading) {
    return (
      <Panel title="Verification">
        <Empty
          icon="shieldCheck"
          title="Loading..."
          body="Fetching your status."
        />
      </Panel>
    );
  }

  if (call.error || !status) {
    return (
      <Panel title="Verification">
        <Empty
          icon="alertTriangle"
          title="Could not load your verification status"
          body={call.error?.message || "Please try again."}
          action={
            <Btn variant="outline" onClick={call.reload}>
              Try again
            </Btn>
          }
        />
      </Panel>
    );
  }

  const stages = status.stages || [];

  return (
    <>
      {status.changes_requested ? (
        <p className="note-box" style={{ marginBottom: 16 }}>
          <Icon name="alertTriangle" size={15} />{" "}
          <strong>Changes requested:</strong> {status.changes_requested}
        </p>
      ) : null}

      <Panel
        title="Verification"
        sub={
          status.submitted_at
            ? `Submitted ${dateLabel(status.submitted_at)}`
            : "Not submitted yet"
        }
        badge={{
          label: (
            status.verification_status ||
            status.daycare_status ||
            ""
          ).replace(/_/g, " "),
          tone:
            STATUS_TONE[status.verification_status] ||
            STATUS_TONE[status.daycare_status] ||
            "grey",
        }}
      >
        {stages.length === 0 ? (
          <Empty
            icon="shieldCheck"
            title="No stages recorded"
            body="Your application has not started review yet."
          />
        ) : (
          <ol className="vtimeline">
            {stages.map((stage) => (
              <li key={stage.id} className={stage.completed ? "is-done" : ""}>
                <span className="vtimeline__dot">
                  <Icon name={stage.completed ? "check" : "clock"} size={12} />
                </span>
                <span className="vtimeline__body">
                  <strong>{stage.title}</strong>
                  <span className="muted">{stage.body}</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {stage.completed
                      ? dateLabel(stage.completed_at)
                      : "In progress"}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}

        <Row
          label="Listing live"
          value={
            status.is_published ? (
              <Tag tone="green">Yes</Tag>
            ) : (
              <Tag tone="grey">Not yet</Tag>
            )
          }
        />
        <Row
          label="Verified badge"
          value={
            status.verified_badge ? (
              <Tag tone="green">Issued</Tag>
            ) : (
              <Tag tone="amber">Not issued</Tag>
            )
          }
        />
        {status.estimated_completion ? (
          <Row
            label="Estimated completion"
            value={dateLabel(status.estimated_completion)}
          />
        ) : null}
      </Panel>
    </>
  );
}
