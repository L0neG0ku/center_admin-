import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Avatar,
  Btn,
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
import { roles, staff, staffOnDuty } from "../../data/dash/staff.js";
import { classroomNames } from "../../data/dash/seed.js";

const dutyTone = { Present: "green", Absent: "red", "On leave": "blue" };

export default function Staff() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [room, setRoom] = useState("");
  const [selected, setSelected] = useState(null);
  const [inviting, setInviting] = useState(false);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return staff.filter((person) => {
      if (role && person.role !== role) return false;
      if (room && person.classroom !== room) return false;
      return !needle || person.name.toLowerCase().includes(needle) || person.role.toLowerCase().includes(needle);
    });
  }, [query, role, room]);

  const columns = [
    { key: "name", header: "Staff member", render: (row) => <Who name={row.name} sub={row.id} /> },
    { key: "role", header: "Role" },
    { key: "classroom", header: "Classroom" },
    {
      key: "contact",
      header: "Contact",
      render: (row) => (
        <span>
          {row.phone}
          <br />
          <span className="muted" style={{ fontSize: 12.5 }}>
            {row.email}
          </span>
        </span>
      ),
    },
    { key: "shift", header: "Shift", render: (row) => <span className="nowrap">{row.shift}</span> },
    {
      key: "todayStatus",
      header: "Today",
      render: (row) => (
        <Tag tone={dutyTone[row.todayStatus]} dot>
          {row.todayStatus}
        </Tag>
      ),
    },
    {
      key: "verified",
      header: "Background check",
      render: (row) =>
        row.verified ? (
          <Tag tone="green">Cleared</Tag>
        ) : (
          <Tag tone="amber">In progress</Tag>
        ),
    },
  ];

  return (
    <>
      <PageHead title="Staff" sub={`${staff.length} people on your team`}>
        <Btn variant="outline" icon="download" onClick={() => toast("Staff list exported")}>
          Export
        </Btn>
        <Btn icon="userPlus" onClick={() => setInviting(true)}>
          Add staff
        </Btn>
      </PageHead>

      <div className="stats">
        <StatCard icon="users" tone="brand" label="Total staff" value={staff.length} />
        <StatCard icon="checkCircle" tone="green" label="On duty today" value={staffOnDuty} />
        <StatCard icon="calendar" tone="blue" label="On leave" value={staff.filter((p) => p.todayStatus === "On leave").length} />
        <StatCard icon="shieldCheck" tone="amber" label="Checks pending" value={staff.filter((p) => !p.verified).length} />
      </div>

      <div className="toolbar">
        <Search value={query} onChange={setQuery} placeholder="Search staff by name or role..." />
        <Select value={role} onChange={setRole} options={roles} placeholder="All roles" />
        <Select value={room} onChange={setRoom} options={classroomNames} placeholder="All classrooms" />
        <div className="toolbar__spacer" />
        <Reset
          onClick={() => {
            setQuery("");
            setRole("");
            setRoom("");
          }}
        />
      </div>

      <Panel title="Team" badge={{ label: `${rows.length} shown`, tone: "brand" }} flush>
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={setSelected}
          selectedId={selected?.id}
          empty={{ title: "No staff match those filters", body: "Try clearing the role or classroom." }}
        />
      </Panel>

      {selected ? (
        <Drawer
          title="Staff profile"
          sub="Role, contact details and attendance"
          onClose={() => setSelected(null)}
          footer={
            <>
              <Btn variant="danger" onClick={() => toast(`${selected.name} marked inactive`)}>
                Deactivate
              </Btn>
              <Btn icon="pencil" onClick={() => toast("Staff profile saved")}>
                Edit
              </Btn>
            </>
          }
        >
          <div className="dident">
            <Avatar name={selected.name} size={48} />
            <div className="dident__text">
              <strong>{selected.name}</strong>
              <span>
                {selected.role} · {selected.id}
              </span>
            </div>
            <Tag tone={selected.status === "Active" ? "green" : "grey"} dot>
              {selected.status}
            </Tag>
          </div>

          <section className="dsec">
            <h3>Assignment</h3>
            <div className="dgrid">
              <Fact label="Classroom" value={selected.classroom} />
              <Fact label="Shift" value={selected.shift} />
              <Fact label="Joined on" value={selected.joinedLabel} />
              <Fact label="Qualification" value={selected.qualification} />
            </div>
          </section>

          <section className="dsec">
            <h3>Contact</h3>
            <div className="dgrid">
              <Fact label="Mobile" value={selected.phone} />
              <Fact label="Email" value={selected.email} />
            </div>
            <div style={{ marginTop: 14 }}>
              <Fact label="Address" value={selected.address} />
            </div>
          </section>

          <section className="dsec">
            <h3>Attendance</h3>
            <Row label="Today" value={<Tag tone={dutyTone[selected.todayStatus]}>{selected.todayStatus}</Tag>} />
            <Row label="Checked in at" value={selected.checkIn} />
            <Row label="This month" value={`${selected.attendanceRate}%`} />
            <div className="dbar" style={{ marginTop: 12 }}>
              <span style={{ width: `${selected.attendanceRate}%` }} />
            </div>
          </section>

          <section className="dsec">
            <h3>
              <Icon name="shieldCheck" size={16} /> Background check
            </h3>
            <p className="note-box">
              {selected.verified
                ? "Cleared by the Kribble verification team. Kribble runs these checks directly — you don't upload anything."
                : "In progress with the Kribble verification team. You'll be notified once it clears."}
            </p>
          </section>
        </Drawer>
      ) : null}

      {inviting ? (
        <Modal
          title="Add a staff member"
          sub="They'll get an invite to set their own password."
          onClose={() => setInviting(false)}
          footer={
            <>
              <Btn variant="outline" onClick={() => setInviting(false)}>
                Cancel
              </Btn>
              <Btn
                icon="send"
                onClick={() => {
                  setInviting(false);
                  toast("Invite sent");
                }}
              >
                Send invite
              </Btn>
            </>
          }
        >
          <div className="dfield-2">
            <label className="dfield">
              <span>Full name</span>
              <input placeholder="e.g. Anita Rao" />
            </label>
            <label className="dfield">
              <span>Role</span>
              <select defaultValue="">
                <option value="">Select a role</option>
                {roles.map((entry) => (
                  <option key={entry}>{entry}</option>
                ))}
              </select>
            </label>
            <label className="dfield">
              <span>Mobile</span>
              <input placeholder="+91 98765 43210" />
            </label>
            <label className="dfield">
              <span>Email</span>
              <input placeholder="name@littlestars.in" />
            </label>
            <label className="dfield">
              <span>Classroom</span>
              <select defaultValue="">
                <option value="">Not assigned</option>
                {classroomNames.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="dfield">
              <span>Shift</span>
              <input placeholder="8:00 AM – 4:00 PM" />
            </label>
          </div>
          <p className="note-box">
            Kribble runs the police and background verification for every staff member you add. You'll
            see the status here once it's done.
          </p>
        </Modal>
      ) : null}
    </>
  );
}
