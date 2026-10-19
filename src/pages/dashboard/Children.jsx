import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../../icons/Icon.jsx";
import {
  Avatar,
  Btn,
  Empty,
  Fact,
  PageHead,
  Panel,
  Reset,
  Row,
  Search,
  Select,
  StatCard,
  Tag,
  Who,
} from "../../components/dash/ui.jsx";
import DataTable from "../../components/dash/DataTable.jsx";
import { Drawer, Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import * as api from "../../api/endpoints.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * The centre's roster, from `GET /daycares/me/children`.
 *
 * WHAT CAME OUT, because the API does not hold it: a monthly fee amount
 * (`fee_plan` is a free-text label, there is no money on an enrolment and no
 * billing endpoints at all), a per-child document checklist, and a single
 * "parent" column with one name and number.
 *
 * What replaced the parent column is the thing an owner actually needs to
 * chase: how many guardians have ACCEPTED, and how many invites are still
 * pending. A child whose parent never accepted is a child whose family cannot
 * see a single thing the centre logs, and nothing else in the product
 * surfaces that.
 */

const statusTone = {
  ACTIVE: "green",
  ON_LEAVE: "blue",
  WITHDRAWN: "grey",
};

const statusLabel = {
  ACTIVE: "Enrolled",
  ON_LEAVE: "On leave",
  WITHDRAWN: "Withdrawn",
};

const genderLabel = { MALE: "Boy", FEMALE: "Girl", OTHER: "Not specified" };

const dateLabel = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

/** Age the way a parent says it: months under two, then years. */
function ageLabel(dob) {
  if (!dob) return "";
  const born = new Date(dob);
  const now = new Date();
  let months =
    (now.getFullYear() - born.getFullYear()) * 12 +
    now.getMonth() -
    born.getMonth();
  if (now.getDate() < born.getDate()) months -= 1;
  if (months < 1) return "Newborn";
  if (months < 24) return `${months} ${months === 1 ? "month" : "months"}`;
  const years = Math.round((months / 12) * 10) / 10;
  return `${Number.isInteger(years) ? years : years.toFixed(1)} yrs`;
}

function toRow(child) {
  const enrollment = child.enrollment || null;
  return {
    id: child.id,
    publicId: child.public_id || "",
    name: child.name || "",
    dob: child.date_of_birth || null,
    gender: child.gender || "OTHER",
    photoUrl: child.photo_url || null,
    room: enrollment?.classroom?.name || "",
    roomId: enrollment?.classroom_id || "",
    feePlan: enrollment?.fee_plan || "",
    status: enrollment?.status || "ACTIVE",
    startDate: enrollment?.start_date || null,
    guardianCount: child.guardian_count ?? 0,
    pendingInvites: child.pending_invite_count ?? 0,
  };
}

export default function Children() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [room, setRoom] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(params.get("new") === "1");

  // The server filters by room and status, so those go in the request rather
  // than being applied to a page of results — a centre with 132 children
  // would otherwise filter only whatever the first page happened to contain.
  // listAllChildren follows the pager, because per_page is capped at 100.
  const childrenCall = useResource(
    (signal) =>
      api.listAllChildren(
        { classroom_id: room || undefined, status: status || undefined },
        { signal }
      ),
    [room, status]
  );
  const roomsCall = useResource((signal) => api.listClassrooms({ signal }), []);

  const rooms = useMemo(() => roomsCall.data || [], [roomsCall.data]);
  const all = useMemo(
    () => (childrenCall.data || []).map(toRow),
    [childrenCall.data]
  );

  // Name search stays local: it is instant, and the API's `search` would add
  // a request per keystroke for a list this size.
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(
      (child) =>
        child.name.toLowerCase().includes(needle) ||
        child.publicId.toLowerCase().includes(needle)
    );
  }, [all, query]);

  const closeAdd = () => {
    setAdding(false);
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  };

  const columns = [
    {
      key: "name",
      header: "Child",
      render: (child) => <Who name={child.name} src={child.photoUrl} sub={child.publicId} />,
    },
    {
      key: "room",
      header: "Classroom",
      render: (child) => (
        <span>
          {child.room || <Tag tone="amber">No room</Tag>}
          <br />
          <span className="muted" style={{ fontSize: 12.5 }}>
            {ageLabel(child.dob)}
          </span>
        </span>
      ),
    },
    {
      key: "guardians",
      header: "Parents",
      render: (child) => (
        <span>
          {child.guardianCount === 0 ? (
            <Tag tone="red" dot>
              None linked
            </Tag>
          ) : (
            <>
              {child.guardianCount} linked
            </>
          )}
          {child.pendingInvites > 0 ? (
            <>
              <br />
              <span className="muted" style={{ fontSize: 12.5 }}>
                {child.pendingInvites} invite
                {child.pendingInvites === 1 ? "" : "s"} pending
              </span>
            </>
          ) : null}
        </span>
      ),
    },
    { key: "feePlan", header: "Fee plan", render: (child) => child.feePlan || "—" },
    {
      key: "startDate",
      header: "Enrolled",
      render: (child) => <span className="nowrap">{dateLabel(child.startDate)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (child) => (
        <Tag tone={statusTone[child.status] || "grey"} dot>
          {statusLabel[child.status] || child.status}
        </Tag>
      ),
    },
  ];

  const noParent = all.filter((child) => child.guardianCount === 0).length;

  if (childrenCall.error) {
    return (
      <>
        <PageHead title="Children" />
        <Panel>
          <Empty
            icon="alertTriangle"
            title="Could not load the roster"
            body={childrenCall.error.message}
            action={
              <Btn variant="outline" onClick={childrenCall.reload}>
                Try again
              </Btn>
            }
          />
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Children"
        sub={
          childrenCall.loading
            ? "Loading the roster..."
            : `${all.length} ${all.length === 1 ? "child" : "children"}`
        }
      >
        <Btn icon="userPlus" onClick={() => setAdding(true)}>
          Add a child
        </Btn>
      </PageHead>

      <div className="stats">
        <StatCard icon="baby" tone="brand" label="On the roster" value={all.length} />
        <StatCard
          icon="checkCircle"
          tone="green"
          label="Enrolled"
          value={all.filter((c) => c.status === "ACTIVE").length}
        />
        <StatCard
          icon="calendar"
          tone="blue"
          label="On leave"
          value={all.filter((c) => c.status === "ON_LEAVE").length}
        />
        <StatCard
          icon="alertTriangle"
          tone={noParent > 0 ? "amber" : "grey"}
          label="No parent linked"
          value={noParent}
        />
      </div>

      {noParent > 0 ? (
        <p className="note-box" style={{ marginBottom: 16 }}>
          <Icon name="alertTriangle" size={15} />{" "}
          {noParent === 1 ? "One child has" : `${noParent} children have`} no
          parent linked yet — their family cannot see anything the centre
          logs until an invite is accepted.
        </p>
      ) : null}

      <div className="toolbar">
        <Search
          value={query}
          onChange={setQuery}
          placeholder="Search by name or ID..."
        />
        <Select
          value={room}
          onChange={setRoom}
          options={rooms.map((r) => ({ value: r.id, label: r.name }))}
          placeholder="All classrooms"
        />
        <Select
          value={status}
          onChange={setStatus}
          options={[
            { value: "ACTIVE", label: "Enrolled" },
            { value: "ON_LEAVE", label: "On leave" },
            { value: "WITHDRAWN", label: "Withdrawn" },
          ]}
          placeholder="Any status"
        />
        <div className="toolbar__spacer" />
        <Reset
          onClick={() => {
            setQuery("");
            setRoom("");
            setStatus("");
          }}
        />
      </div>

      <Panel
        title="Roster"
        badge={{ label: `${rows.length} shown`, tone: "brand" }}
        flush
      >
        {childrenCall.loading ? (
          <Empty icon="baby" title="Loading..." body="Fetching the roster." />
        ) : all.length === 0 ? (
          <Empty
            icon="userPlus"
            title="No children yet"
            body="Enrol a child and invite their parent. The parent app shows nothing until an invite is accepted."
            action={<Btn icon="userPlus" onClick={() => setAdding(true)}>Add a child</Btn>}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(child) => setSelectedId(child.id)}
            selectedId={selectedId}
            empty={{
              title: "No children match that search",
              body: "Try a different name, or clear the filters.",
            }}
          />
        )}
      </Panel>

      {selectedId ? (
        <ChildDrawer
          childId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={(message) => {
            childrenCall.reload();
            if (message) toast(message);
          }}
        />
      ) : null}

      {adding ? (
        <AddChildModal
          rooms={rooms}
          onClose={closeAdd}
          onAdded={(name, result) => {
            closeAdd();
            childrenCall.reload();
            // Say which actually happened. "They can sign in" is the
            // normal case; an existing parent gaining a second child is
            // not something to tell the family about.
            toast(
              result?.guardian_account_created
                ? `${name} enrolled — the parent can sign in with their number`
                : `${name} enrolled — invite sent to the parent`
            );
          }}
        />
      ) : null}
    </>
  );
}

/** One child in full: the detail call is the only one with guardians. */
function ChildDrawer({ childId, onClose, onChanged }) {
  const call = useResource(
    (signal) => api.getChild(childId, { signal }),
    [childId]
  );
  const child = call.data;

  if (call.loading) {
    return (
      <Drawer title="Child" sub="Loading..." onClose={onClose}>
        <Empty icon="baby" title="Loading..." body="Fetching this child." />
      </Drawer>
    );
  }

  if (call.error || !child) {
    return (
      <Drawer title="Child" onClose={onClose}>
        <Empty
          icon="alertTriangle"
          title="Could not load this child"
          body={call.error?.message || "Please try again."}
          action={<Btn variant="outline" onClick={call.reload}>Try again</Btn>}
        />
      </Drawer>
    );
  }

  const enrollment = child.enrollment || {};
  const guardians = child.guardians || [];
  const invites = (child.invites || []).filter(
    (invite) => invite.status === "PENDING"
  );

  return (
    <Drawer
      title="Child"
      sub="Enrolment, parents and medical details"
      onClose={onClose}
      wide
    >
      <div className="dident">
        <Avatar name={child.name} size={48} src={child.photo_url} />
        <div className="dident__text">
          <strong>{child.name}</strong>
          <span>
            {ageLabel(child.date_of_birth)} ·{" "}
            {genderLabel[child.gender] || "—"} · {child.public_id}
          </span>
        </div>
        <Tag tone={statusTone[enrollment.status] || "grey"} dot>
          {statusLabel[enrollment.status] || "—"}
        </Tag>
      </div>

      <section className="dsec">
        <h3>Enrolment</h3>
        <div className="dgrid">
          <Fact label="Classroom" value={enrollment.classroom?.name || "Not assigned"} />
          <Fact label="Fee plan" value={enrollment.fee_plan || "—"} />
          <Fact label="Started" value={dateLabel(enrollment.start_date)} />
          <Fact label="Date of birth" value={dateLabel(child.date_of_birth)} />
        </div>
      </section>

      <section className="dsec">
        <h3>
          <Icon name="heart" size={16} /> Medical
        </h3>
        {/* Blank means nobody recorded it, which is not the same as none —
            so each row says which. */}
        <Row label="Blood group" value={child.blood_group || <span className="muted">Not recorded</span>} />
        <Row label="Allergies" value={child.allergies || <span className="muted">None recorded</span>} />
        <Row label="Notes" value={child.medical_notes || <span className="muted">None recorded</span>} />
      </section>

      <section className="dsec">
        <h3>Parents</h3>
        {guardians.length === 0 ? (
          <p className="note-box">
            Nobody is linked yet. Until someone is, this family sees nothing
            in the Kribble app — no attendance, no photos, no daily care.
          </p>
        ) : (
          guardians.map((guardian) => (
            <Row
              key={guardian.id}
              label={
                <>
                  {guardian.user_name}
                  {guardian.is_primary ? (
                    <>
                      {" "}
                      <Tag tone="brand">Primary</Tag>
                    </>
                  ) : null}
                </>
              }
              value={
                <span className="nowrap">
                  {guardian.relation} · {guardian.user_phone || "no number"}
                </span>
              }
            />
          ))
        )}

        <AddGuardianForm
          childId={childId}
          onAdded={(message) => {
            call.reload();
            onChanged(message);
          }}
        />
      </section>

      {invites.length > 0 ? (
        <section className="dsec">
          <h3>Pending invites</h3>
          {invites.map((invite) => (
            <InviteRow
              key={invite.id}
              childId={childId}
              invite={invite}
              onChanged={(message) => {
                call.reload();
                onChanged(message);
              }}
            />
          ))}
        </section>
      ) : null}
    </Drawer>
  );
}

/**
 * Add another parent to a child, creating their login.
 *
 * Collapsed until asked for: most children have one guardian, and a form
 * sitting open on every drawer is an invitation to add a second person by
 * accident.
 *
 * The same number twice is refused by the API, and a number belonging to a
 * staff account is refused too — both come back as a readable message rather
 * than being caught here, because the server is the only place that knows.
 */
function AddGuardianForm({ childId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("FATHER");
  const [localError, setLocalError] = useState(null);

  const add = useAction(() =>
    api.addGuardian(childId, {
      full_name: fullName.trim(),
      phone: phone.trim(),
      relation,
    })
  );

  const reset = () => {
    setOpen(false);
    setFullName("");
    setPhone("");
    setRelation("FATHER");
    setLocalError(null);
  };

  const submit = () => {
    setLocalError(null);
    if (!fullName.trim()) return setLocalError("Enter their name.");
    if (phone.replace(/\D/g, "").length < 10) {
      return setLocalError("Enter a 10-digit mobile — it is how they sign in.");
    }
    return add
      .run()
      .then((result) => {
        const name = fullName.trim();
        reset();
        // An existing parent gaining another child is not news for the
        // family; a new login is.
        onAdded(
          result?.account_created
            ? `${name} added — they can sign in with their number`
            : `${name} added to this child`
        );
      })
      .catch(() => {});
  };

  if (!open) {
    return (
      <Btn
        variant="outline"
        icon="userPlus"
        onClick={() => setOpen(true)}
        style={{ marginTop: 12 }}
      >
        Add another parent
      </Btn>
    );
  }

  const error = localError || add.error?.message;
  const fieldErrors = add.error?.fields || {};

  return (
    <div className="note-box note-box--stack" style={{ marginTop: 12 }}>
      <div className="dfield-2">
        <label className="dfield">
          <span>Full name</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="e.g. Rohit Shah"
          />
          {fieldErrors.full_name ? (
            <small className="dfield__error">{fieldErrors.full_name}</small>
          ) : null}
        </label>
        <label className="dfield">
          <span>Mobile</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+91 98765 43210"
            inputMode="tel"
          />
          {fieldErrors.phone ? (
            <small className="dfield__error">{fieldErrors.phone}</small>
          ) : null}
        </label>
      </div>

      <label className="dfield" style={{ marginTop: 12 }}>
        <span>Relation</span>
        <select
          value={relation}
          onChange={(event) => setRelation(event.target.value)}
        >
          <option value="MOTHER">Mother</option>
          <option value="FATHER">Father</option>
          <option value="GUARDIAN">Guardian</option>
        </select>
      </label>

      {error ? (
        <p className="dfield__error" style={{ marginTop: 12 }}>
          {error}
        </p>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Btn icon="check" disabled={add.busy} onClick={submit}>
          {add.busy ? "Adding..." : "Add parent"}
        </Btn>
        <Btn variant="outline" onClick={reset}>
          Cancel
        </Btn>
      </div>
    </div>
  );
}

function InviteRow({ childId, invite, onChanged }) {
  const resend = useAction(() => api.resendGuardianInvite(childId, invite.id));
  const revoke = useAction(() => api.revokeGuardianInvite(childId, invite.id));

  return (
    <div className="drow">
      <span>
        {invite.phone}
        <br />
        <span className="muted" style={{ fontSize: 12.5 }}>
          {invite.relation} · expires {dateLabel(invite.expires_at)}
        </span>
      </span>
      <strong style={{ display: "flex", gap: 8 }}>
        <Btn
          size="sm"
          variant="outline"
          disabled={resend.busy}
          onClick={() =>
            resend
              .run()
              .then(() => onChanged("Invite sent again"))
              .catch(() => {})
          }
        >
          Resend
        </Btn>
        <Btn
          size="sm"
          variant="danger"
          disabled={revoke.busy}
          onClick={() =>
            revoke
              .run()
              .then(() => onChanged("Invite revoked"))
              .catch(() => {})
          }
        >
          Revoke
        </Btn>
      </strong>
    </div>
  );
}

/**
 * Enrol a child.
 *
 * `primary_guardian` is REQUIRED by the API — a child cannot exist without
 * someone to invite, and creating the child creates the invite in the same
 * call. The old form collected a parent name it then discarded; what the API
 * wants is a phone number and a relation, because the number is what the
 * invite is matched against when the parent signs up.
 */
function AddChildModal({ rooms, onClose, onAdded }) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [feePlan, setFeePlan] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [relation, setRelation] = useState("MOTHER");
  const [localError, setLocalError] = useState(null);

  const create = useAction(() =>
    api.createChild({
      name: name.trim(),
      date_of_birth: dob,
      gender,
      classroom_id: classroomId,
      fee_plan: feePlan.trim(),
      primary_guardian: {
        phone: guardianPhone.trim(),
        relation,
        // Sending a name is what makes the API create the parent's login
        // rather than raise an invite nobody can accept.
        full_name: guardianName.trim(),
        // Optional, and left out entirely when blank: an empty string would
        // fail email validation on the way in.
        ...(guardianEmail.trim() ? { email: guardianEmail.trim() } : {}),
      },
    })
  );

  const submit = () => {
    setLocalError(null);
    if (!name.trim()) return setLocalError("Enter the child's name.");
    if (!dob) return setLocalError("Enter their date of birth.");
    if (!gender) return setLocalError("Choose a gender.");
    if (!classroomId) return setLocalError("Choose a classroom.");
    if (!feePlan.trim()) return setLocalError("Enter a fee plan.");
    if (!guardianName.trim()) return setLocalError("Enter the parent's name.");
    if (guardianPhone.replace(/\D/g, "").length < 10) {
      return setLocalError(
        "Enter the parent's 10-digit mobile — it is how they sign in."
      );
    }
    return create
      .run()
      .then((result) => onAdded(name.trim(), result))
      .catch(() => {});
  };

  const error = localError || create.error?.message;
  const fieldErrors = create.error?.fields || {};

  return (
    <Modal
      title="Add a child"
      sub="This also creates the parent's login, so they can sign in straight away."
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn icon="check" disabled={create.busy} onClick={submit}>
            {create.busy ? "Enrolling..." : "Enrol & create parent login"}
          </Btn>
        </>
      }
    >
      <div className="dfield-2">
        <label className="dfield">
          <span>Child's full name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Aarav Shah"
          />
          {fieldErrors.name ? (
            <small className="dfield__error">{fieldErrors.name}</small>
          ) : null}
        </label>
        <label className="dfield">
          <span>Date of birth</span>
          <input
            type="date"
            value={dob}
            onChange={(event) => setDob(event.target.value)}
          />
          {fieldErrors.date_of_birth ? (
            <small className="dfield__error">{fieldErrors.date_of_birth}</small>
          ) : null}
        </label>
        <label className="dfield">
          <span>Gender</span>
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value)}
          >
            <option value="">Select</option>
            <option value="MALE">Boy</option>
            <option value="FEMALE">Girl</option>
            <option value="OTHER">Prefer not to say</option>
          </select>
        </label>
        <label className="dfield">
          <span>Classroom</span>
          <select
            value={classroomId}
            onChange={(event) => setClassroomId(event.target.value)}
          >
            <option value="">Select a classroom</option>
            {rooms.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
          {rooms.length === 0 ? (
            <small className="dfield__error">
              Add a classroom first — a child is enrolled into one.
            </small>
          ) : null}
        </label>
        <label className="dfield">
          <span>Fee plan</span>
          <input
            value={feePlan}
            onChange={(event) => setFeePlan(event.target.value)}
            placeholder="e.g. Full-day monthly"
          />
        </label>
        <label className="dfield">
          <span>Parent's relation</span>
          <select
            value={relation}
            onChange={(event) => setRelation(event.target.value)}
          >
            <option value="MOTHER">Mother</option>
            <option value="FATHER">Father</option>
            <option value="GUARDIAN">Guardian</option>
          </select>
        </label>
      </div>

      <div className="dfield-2" style={{ marginTop: 14 }}>
        <label className="dfield">
          <span>Parent's full name</span>
          <input
            value={guardianName}
            onChange={(event) => setGuardianName(event.target.value)}
            placeholder="e.g. Meera Shah"
          />
          {fieldErrors.full_name ? (
            <small className="dfield__error">{fieldErrors.full_name}</small>
          ) : null}
        </label>
        <label className="dfield">
          <span>Parent's mobile — this is how they sign in</span>
          <input
            value={guardianPhone}
            onChange={(event) => setGuardianPhone(event.target.value)}
            placeholder="+91 98765 43210"
            inputMode="tel"
          />
          {fieldErrors.primary_guardian || fieldErrors.phone ? (
            <small className="dfield__error">
              {fieldErrors.primary_guardian || fieldErrors.phone}
            </small>
          ) : null}
        </label>
      </div>

      <label className="dfield" style={{ marginTop: 14 }}>
        <span>Parent's email (optional)</span>
        <input
          value={guardianEmail}
          onChange={(event) => setGuardianEmail(event.target.value)}
          placeholder="meera@example.com"
          inputMode="email"
        />
        {fieldErrors.email ? (
          <small className="dfield__error">{fieldErrors.email}</small>
        ) : null}
      </label>

      <p className="dmuted" style={{ marginTop: 14 }}>
        No password is set. The parent signs in with this number and a
        one-time code, so double-check the digits — it is the only way in.
      </p>

      {error ? (
        <p className="dfield__error" style={{ marginTop: 14 }}>
          {error}
        </p>
      ) : null}

      <p className="note-box" style={{ marginTop: 14 }}>
        The parent signs up with this number, accepts the invite and grants
        consent. Until they do, the centre can log care but the family sees
        none of it — and caretakers cannot log care at all for a child with no
        consent.
      </p>
    </Modal>
  );
}
