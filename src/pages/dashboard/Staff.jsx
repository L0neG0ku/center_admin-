import { useMemo, useState } from "react";
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
 * The centre's caretakers, from `GET /daycares/me/staff`.
 *
 * WHAT CAME OUT OF THIS PAGE, because the API has no such thing: shifts,
 * today's duty status, check-in times, a monthly attendance percentage,
 * qualifications, home addresses, and a background-check status. There is no
 * staff attendance table and no verification pipeline for employees — the
 * page was telling an owner "Cleared by the Kribble verification team" about
 * real people on the strength of `index % 6 !== 4`.
 *
 * What replaced them is one column that matters more than all of it: whether
 * the caretaker has ever signed in. A caretaker logs in with phone + OTP, so
 * "added but never signed in" is the actual onboarding blocker, and until SMS
 * delivery is live it will be every one of them.
 */

/** Fields the API genuinely returns, shaped for the table. */
function toRow(person) {
  const rooms = person.classrooms || [];
  return {
    id: person.id,
    publicId: person.public_id || "",
    name: person.full_name || "",
    phone: person.phone || "",
    email: person.email || "",
    jobTitle: person.job_title || "",
    isActive: person.is_active !== false,
    hasSignedIn: Boolean(person.has_signed_in),
    joinedAt: person.joined_at || null,
    rooms,
    roomNames: rooms.map((room) => room.name).join(", "),
  };
}

const dateLabel = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function Staff() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);

  const staffCall = useResource((signal) => api.listStaff({}, { signal }), []);
  const roomsCall = useResource(
    (signal) => api.listClassrooms({ signal }),
    []
  );

  const people = useMemo(
    () => (staffCall.data || []).map(toRow),
    [staffCall.data]
  );
  const rooms = useMemo(() => roomsCall.data || [], [roomsCall.data]);
  const roomNames = useMemo(() => rooms.map((room) => room.name), [rooms]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return people.filter((person) => {
      if (roomFilter && !person.rooms.some((r) => r.name === roomFilter)) {
        return false;
      }
      if (statusFilter === "Signed in" && !person.hasSignedIn) return false;
      if (statusFilter === "Never signed in" && person.hasSignedIn) return false;
      if (statusFilter === "Suspended" && person.isActive) return false;
      if (!needle) return true;
      return (
        person.name.toLowerCase().includes(needle) ||
        person.jobTitle.toLowerCase().includes(needle) ||
        person.phone.includes(needle)
      );
    });
  }, [people, query, roomFilter, statusFilter]);

  const selected = people.find((person) => person.id === selectedId) || null;

  const columns = [
    {
      key: "name",
      header: "Caretaker",
      render: (row) => <Who name={row.name} sub={row.publicId} />,
    },
    { key: "jobTitle", header: "Role", render: (row) => row.jobTitle || "—" },
    {
      key: "rooms",
      header: "Rooms",
      // Plural on purpose: the API assigns a set, and a caretaker covering
      // two rooms is normal. The old single "Classroom" column could not say
      // so.
      render: (row) =>
        row.rooms.length === 0 ? (
          <Tag tone="amber">None assigned</Tag>
        ) : (
          <span className="nowrap">{row.roomNames}</span>
        ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (row) => (
        <span>
          {row.phone}
          {row.email ? (
            <>
              <br />
              <span className="muted" style={{ fontSize: 12.5 }}>
                {row.email}
              </span>
            </>
          ) : null}
        </span>
      ),
    },
    {
      key: "hasSignedIn",
      header: "App access",
      render: (row) =>
        !row.isActive ? (
          <Tag tone="grey" dot>
            Suspended
          </Tag>
        ) : row.hasSignedIn ? (
          <Tag tone="green" dot>
            Signed in
          </Tag>
        ) : (
          <Tag tone="amber" dot>
            Never signed in
          </Tag>
        ),
    },
    {
      key: "joinedAt",
      header: "Added",
      render: (row) => <span className="nowrap">{dateLabel(row.joinedAt)}</span>,
    },
  ];

  const neverSignedIn = people.filter(
    (person) => person.isActive && !person.hasSignedIn
  ).length;
  const unassigned = people.filter(
    (person) => person.isActive && person.rooms.length === 0
  ).length;

  if (staffCall.error) {
    return (
      <>
        <PageHead title="Staff" />
        <Panel>
          <Empty
            icon="alertTriangle"
            title="Could not load your team"
            body={staffCall.error.message}
            action={
              <Btn variant="outline" onClick={staffCall.reload}>
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
        title="Staff"
        sub={
          staffCall.loading
            ? "Loading your team..."
            : `${people.length} ${people.length === 1 ? "caretaker" : "caretakers"} on your team`
        }
      >
        <Btn icon="userPlus" onClick={() => setAdding(true)}>
          Add caretaker
        </Btn>
      </PageHead>

      <div className="stats">
        <StatCard icon="users" tone="brand" label="Caretakers" value={people.length} />
        <StatCard
          icon="checkCircle"
          tone="green"
          label="Signed in"
          value={people.filter((p) => p.hasSignedIn).length}
        />
        <StatCard
          icon="alertTriangle"
          tone="amber"
          label="Never signed in"
          value={neverSignedIn}
        />
        <StatCard
          icon="grid"
          tone="blue"
          label="No room assigned"
          value={unassigned}
        />
      </div>

      {/* A caretaker with no rooms signs in and sees an empty roster. It is
          the owner's to fix and nothing else surfaces it. */}
      {unassigned > 0 ? (
        <p className="note-box" style={{ marginBottom: 16 }}>
          <Icon name="alertTriangle" size={15} />{" "}
          {unassigned === 1
            ? "One caretaker has no room assigned and will see an empty roster."
            : `${unassigned} caretakers have no room assigned and will see an empty roster.`}
        </p>
      ) : null}

      <div className="toolbar">
        <Search
          value={query}
          onChange={setQuery}
          placeholder="Search by name, role or mobile..."
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={["Signed in", "Never signed in", "Suspended"]}
          placeholder="Any status"
        />
        <Select
          value={roomFilter}
          onChange={setRoomFilter}
          options={roomNames}
          placeholder="All rooms"
        />
        <div className="toolbar__spacer" />
        <Reset
          onClick={() => {
            setQuery("");
            setRoomFilter("");
            setStatusFilter("");
          }}
        />
      </div>

      <Panel
        title="Team"
        badge={{ label: `${rows.length} shown`, tone: "brand" }}
        flush
      >
        {staffCall.loading ? (
          <Empty icon="users" title="Loading..." body="Fetching your team." />
        ) : people.length === 0 ? (
          <Empty
            icon="userPlus"
            title="No caretakers yet"
            body="Add the people who will mark attendance and log care. Nothing else in the app works until someone can sign in."
            action={<Btn icon="userPlus" onClick={() => setAdding(true)}>Add caretaker</Btn>}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(row) => setSelectedId(row.id)}
            selectedId={selectedId}
            empty={{
              title: "No caretakers match those filters",
              body: "Try clearing the status or room.",
            }}
          />
        )}
      </Panel>

      {selected ? (
        <StaffDrawer
          person={selected}
          rooms={rooms}
          onClose={() => setSelectedId(null)}
          onChanged={(message) => {
            staffCall.reload();
            if (message) toast(message);
          }}
        />
      ) : null}

      {adding ? (
        <AddStaffModal
          rooms={rooms}
          onClose={() => setAdding(false)}
          onAdded={(name) => {
            setAdding(false);
            staffCall.reload();
            toast(`${name} added`);
          }}
        />
      ) : null}
    </>
  );
}

/** One caretaker: their rooms, their contact details, their app access. */
function StaffDrawer({ person, rooms, onClose, onChanged }) {
  const [assigned, setAssigned] = useState(
    person.rooms.map((room) => room.id)
  );

  const saveRooms = useAction(() =>
    api.setStaffClassrooms(person.id, assigned)
  );
  const toggleActive = useAction(() =>
    api.updateStaff(person.id, { is_active: !person.isActive })
  );
  const remove = useAction(() => api.removeStaff(person.id));

  const roomsChanged =
    assigned.length !== person.rooms.length ||
    assigned.some((id) => !person.rooms.some((room) => room.id === id));

  return (
    <Drawer
      title="Caretaker"
      sub="Rooms, contact details and app access"
      onClose={onClose}
      footer={
        <>
          <Btn
            variant="danger"
            disabled={toggleActive.busy}
            onClick={() =>
              toggleActive
                .run()
                .then(() =>
                  onChanged(
                    person.isActive
                      ? `${person.name} suspended`
                      : `${person.name} reactivated`
                  )
                )
                .catch(() => {})
            }
          >
            {person.isActive ? "Suspend" : "Reactivate"}
          </Btn>
          <Btn
            icon="check"
            disabled={!roomsChanged || saveRooms.busy}
            onClick={() =>
              saveRooms
                .run()
                .then(() => onChanged("Rooms updated"))
                .catch(() => {})
            }
          >
            {roomsChanged ? "Save rooms" : "Saved"}
          </Btn>
        </>
      }
    >
      <div className="dident">
        <Avatar name={person.name} size={48} />
        <div className="dident__text">
          <strong>{person.name}</strong>
          <span>
            {person.jobTitle || "Caretaker"} · {person.publicId}
          </span>
        </div>
        <Tag tone={person.isActive ? "green" : "grey"} dot>
          {person.isActive ? "Active" : "Suspended"}
        </Tag>
      </div>

      <section className="dsec">
        <h3>Rooms</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
          Their rooms decide which children they can see and log care for.
          Saving replaces the whole set.
        </p>
        {rooms.length === 0 ? (
          <p className="note-box">
            You have no classrooms yet. Add one before assigning caretakers.
          </p>
        ) : (
          <div className="dchips">
            {rooms.map((room) => {
              const on = assigned.includes(room.id);
              return (
                <button
                  key={room.id}
                  type="button"
                  className={`dchip ${on ? "is-on" : ""}`}
                  onClick={() =>
                    setAssigned((current) =>
                      on
                        ? current.filter((id) => id !== room.id)
                        : [...current, room.id]
                    )
                  }
                >
                  {on ? <Icon name="check" size={13} /> : null} {room.name}
                </button>
              );
            })}
          </div>
        )}
        {saveRooms.error ? (
          <p className="dfield__error">{saveRooms.error.message}</p>
        ) : null}
      </section>

      <section className="dsec">
        <h3>Contact</h3>
        <div className="dgrid">
          <Fact label="Mobile" value={person.phone || "—"} />
          <Fact label="Email" value={person.email || "Not given"} />
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
          The mobile number is their login and cannot be changed. To move them
          to a new number, remove them and add them again.
        </p>
      </section>

      <section className="dsec">
        <h3>App access</h3>
        <Row label="Added on" value={dateLabel(person.joinedAt)} />
        <Row
          label="Signed in"
          value={
            person.hasSignedIn ? (
              <Tag tone="green">Yes</Tag>
            ) : (
              <Tag tone="amber">Not yet</Tag>
            )
          }
        />
        {!person.hasSignedIn ? (
          <p className="note-box" style={{ marginTop: 12 }}>
            They sign in on the Kribble staff app with this mobile number and a
            code sent by SMS — there is no password to share.
          </p>
        ) : null}
      </section>

      <section className="dsec">
        <h3>Remove</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
          Removing them revokes access immediately. Records they already wrote
          stay, and still name them.
        </p>
        {remove.error ? (
          <p className="dfield__error">{remove.error.message}</p>
        ) : null}
        <Btn
          variant="outline"
          icon="trash"
          disabled={remove.busy}
          onClick={() =>
            remove
              .run()
              .then(() => {
                onChanged(`${person.name} removed`);
                onClose();
              })
              .catch(() => {})
          }
        >
          Remove from centre
        </Btn>
      </section>
    </Drawer>
  );
}

/**
 * Add a caretaker.
 *
 * The old copy said "They'll get an invite to set their own password" and
 * promised that "Kribble runs the police and background verification for
 * every staff member you add". Neither is true: the backend creates the
 * account with a NULL password hash on purpose because caretakers sign in
 * with phone + OTP, and there is no verification pipeline for employees at
 * all. Both lines are gone.
 */
function AddStaffModal({ rooms, onClose, onAdded }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [assigned, setAssigned] = useState([]);
  const [localError, setLocalError] = useState(null);

  const create = useAction(() =>
    api.createStaff({
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      job_title: jobTitle.trim() || null,
      classroom_ids: assigned,
    })
  );

  const submit = () => {
    setLocalError(null);
    if (fullName.trim().length < 2) {
      setLocalError("Enter their full name.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setLocalError("Enter a 10-digit mobile number — it is their login.");
      return;
    }
    create
      .run()
      .then(() => onAdded(fullName.trim()))
      .catch(() => {});
  };

  const error = localError || create.error?.message;
  const fieldErrors = create.error?.fields || {};

  return (
    <Modal
      title="Add a caretaker"
      sub="They sign in on the staff app with this mobile number."
      onClose={onClose}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn icon="userPlus" disabled={create.busy} onClick={submit}>
            {create.busy ? "Adding..." : "Add caretaker"}
          </Btn>
        </>
      }
    >
      <div className="dfield-2">
        <label className="dfield">
          <span>Full name</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="e.g. Anita Rao"
          />
          {fieldErrors.full_name ? (
            <small className="dfield__error">{fieldErrors.full_name}</small>
          ) : null}
        </label>
        <label className="dfield">
          <span>Mobile — their login</span>
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
        <label className="dfield">
          <span>Role (optional)</span>
          <input
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            placeholder="Room lead"
          />
        </label>
        <label className="dfield">
          <span>Email (optional)</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@centre.com"
            inputMode="email"
          />
          {fieldErrors.email ? (
            <small className="dfield__error">{fieldErrors.email}</small>
          ) : null}
        </label>
      </div>

      <div style={{ marginTop: 14 }}>
        <span className="dfield__label">Rooms (optional — set later if you like)</span>
        {rooms.length === 0 ? (
          <p className="note-box" style={{ marginTop: 8 }}>
            You have no classrooms yet. Add one and you can assign rooms here.
          </p>
        ) : (
          <div className="dchips" style={{ marginTop: 8 }}>
            {rooms.map((room) => {
              const on = assigned.includes(room.id);
              return (
                <button
                  key={room.id}
                  type="button"
                  className={`dchip ${on ? "is-on" : ""}`}
                  onClick={() =>
                    setAssigned((current) =>
                      on
                        ? current.filter((id) => id !== room.id)
                        : [...current, room.id]
                    )
                  }
                >
                  {on ? <Icon name="check" size={13} /> : null} {room.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error ? (
        <p className="dfield__error" style={{ marginTop: 14 }}>
          {error}
        </p>
      ) : null}

      <p className="note-box" style={{ marginTop: 14 }}>
        No password is created. They open the staff app, enter this mobile
        number and the code it sends them.
      </p>
    </Modal>
  );
}
