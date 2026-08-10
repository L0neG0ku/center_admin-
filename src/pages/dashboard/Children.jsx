import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  Tabs,
  Tag,
  Who,
} from "../../components/dash/ui.jsx";
import DataTable from "../../components/dash/DataTable.jsx";
import { Drawer, Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import { children, childStatusTone } from "../../data/dash/children.js";
import { classroomNames, classrooms, fmtMoney } from "../../data/dash/seed.js";

const statuses = ["Active", "On leave", "Graduating"];

export default function Children() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [room, setRoom] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("profile");
  const [adding, setAdding] = useState(params.get("new") === "1");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return children.filter((child) => {
      if (room && child.classroom !== room) return false;
      if (status && child.status !== status) return false;
      if (!needle) return true;
      return (
        child.name.toLowerCase().includes(needle) ||
        child.id.toLowerCase().includes(needle) ||
        child.guardian.toLowerCase().includes(needle)
      );
    });
  }, [query, room, status]);

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
      render: (child) => <Who name={child.name} sub={child.id} />,
    },
    {
      key: "classroom",
      header: "Classroom",
      render: (child) => (
        <span>
          {child.classroom}
          <br />
          <span className="muted" style={{ fontSize: 12.5 }}>
            {child.ageLabel}
          </span>
        </span>
      ),
    },
    {
      key: "guardian",
      header: "Parent / guardian",
      render: (child) => (
        <span>
          {child.guardian}
          <br />
          <span className="muted" style={{ fontSize: 12.5 }}>
            {child.guardianRelation} · {child.phone}
          </span>
        </span>
      ),
    },
    {
      key: "feePlan",
      header: "Fee plan",
      render: (child) => (
        <span>
          {child.feePlan}
          <br />
          <span className="muted" style={{ fontSize: 12.5 }}>
            {fmtMoney(child.monthlyFee)} / month
          </span>
        </span>
      ),
    },
    {
      key: "allergies",
      header: "Allergies",
      render: (child) =>
        child.allergies.length ? (
          <Tag tone="red">{child.allergies.join(", ")}</Tag>
        ) : (
          <span className="muted">None</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (child) => (
        <Tag tone={childStatusTone[child.status]} dot>
          {child.status}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <PageHead
        title="Children"
        sub={`${children.length} children on the roster across ${classrooms.length} classrooms`}
      >
        <Btn variant="outline" icon="download" onClick={() => toast("Roster exported as CSV")}>
          Export
        </Btn>
        <Btn icon="plus" onClick={() => setAdding(true)}>
          Add child
        </Btn>
      </PageHead>

      <div className="toolbar">
        <Search value={query} onChange={setQuery} placeholder="Search by name, ID or parent..." />
        <Select value={room} onChange={setRoom} options={classroomNames} placeholder="All classrooms" />
        <Select value={status} onChange={setStatus} options={statuses} placeholder="All statuses" />
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
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(child) => {
            setSelected(child);
            setTab("profile");
          }}
          selectedId={selected?.id}
          empty={{
            title: "No children match those filters",
            body: "Try a different classroom, or clear the search.",
          }}
        />
      </Panel>

      {selected ? (
        <Drawer
          title="Child profile"
          sub="Admission, parents, medical and attendance"
          onClose={() => setSelected(null)}
          footer={
            <>
              <Btn variant="outline" icon="message" onClick={() => toast("Message sent to parent")}>
                Message parent
              </Btn>
              <Btn icon="pencil" onClick={() => toast("Profile saved")}>
                Edit profile
              </Btn>
            </>
          }
        >
          <div className="dident">
            <Avatar name={selected.name} size={48} />
            <div className="dident__text">
              <strong>{selected.name}</strong>
              <span>
                {selected.id} · {selected.classroom}
              </span>
            </div>
            <Tag tone={childStatusTone[selected.status]} dot>
              {selected.status}
            </Tag>
          </div>

          <div style={{ marginBottom: 20 }}>
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { id: "profile", label: "Profile" },
                { id: "medical", label: "Medical" },
                { id: "docs", label: "Documents" },
                { id: "attendance", label: "Attendance" },
              ]}
            />
          </div>

          {tab === "profile" ? (
            <>
              <section className="dsec">
                <h3>Admission details</h3>
                <div className="dgrid">
                  <Fact label="Date of birth" value={selected.dobLabel} />
                  <Fact label="Age" value={selected.ageLabel} />
                  <Fact label="Gender" value={selected.gender} />
                  <Fact label="Admitted on" value={selected.admittedLabel} />
                  <Fact label="Fee plan" value={selected.feePlan} />
                  <Fact label="Monthly fee" value={fmtMoney(selected.monthlyFee)} />
                </div>
              </section>

              <section className="dsec">
                <h3>Parents</h3>
                <div className="dgrid">
                  <Fact label="Mother" value={selected.mother} />
                  <Fact label="Father" value={selected.father} />
                  <Fact label="Primary contact" value={selected.phone} />
                  <Fact label="Alternate" value={selected.altPhone} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <Fact label="Email" value={selected.email} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <Fact label="Home address" value={selected.address} />
                </div>
              </section>

              <section className="dsec">
                <h3>Emergency contacts</h3>
                {selected.emergency.map((contact) => (
                  <div key={contact.name} className="mini-card">
                    <span className="mini-card__icon tone-red">
                      <Icon name="phone" size={16} />
                    </span>
                    <div>
                      <strong>{contact.name}</strong>
                      <span>
                        {contact.relation} · {contact.phone}
                      </span>
                    </div>
                  </div>
                ))}
              </section>
            </>
          ) : null}

          {tab === "medical" ? (
            <>
              <section className="dsec">
                <h3>Allergies</h3>
                {selected.allergies.length ? (
                  <div className="chips">
                    {selected.allergies.map((allergy) => (
                      <span key={allergy} className="chip chip--red">
                        <Icon name="alertTriangle" size={14} />
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No allergies recorded.</p>
                )}
              </section>

              <section className="dsec">
                <h3>Medical notes</h3>
                <p className="note-box">{selected.medical}</p>
              </section>

              <section className="dsec">
                <h3>Other</h3>
                <Row label="Blood group" value={selected.bloodGroup} />
                <Row label="Nurse on site" value="Yes — Savitha Rao" />
                <Row label="Medication at centre" value="None" />
              </section>
            </>
          ) : null}

          {tab === "docs" ? (
            <section className="dsec">
              <h3>Admission documents</h3>
              <ul className="doclist">
                {selected.documents.map((doc) => (
                  <li key={doc.name}>
                    <span className={`mini-card__icon ${doc.status === "Verified" ? "tone-green" : "tone-amber"}`}>
                      <Icon name={doc.status === "Verified" ? "fileCheck" : "fileText"} size={16} />
                    </span>
                    <div>
                      <strong>{doc.name}</strong>
                      <span className="muted">
                        {doc.status === "Verified" ? "Uploaded and verified" : "Not received yet"}
                      </span>
                    </div>
                    <Tag tone={doc.status === "Verified" ? "green" : "amber"}>{doc.status}</Tag>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {tab === "attendance" ? (
            <>
              <section className="dsec">
                <h3>This term</h3>
                <div className="dgrid">
                  <Fact label="Attendance rate" value={`${selected.attendanceRate}%`} />
                  <Fact label="Days absent" value={`${Math.round((100 - selected.attendanceRate) / 4)} this month`} />
                </div>
                <div className="dbar" style={{ marginTop: 14 }}>
                  <span style={{ width: `${selected.attendanceRate}%` }} />
                </div>
              </section>

              <section className="dsec">
                <h3>Last 6 days</h3>
                {["Present", "Present", "Absent", "Present", "Late", "Present"].map((state, index) => (
                  <Row
                    key={index}
                    label={new Date(Date.now() - (index + 1) * 86400000).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                    value={
                      <Tag tone={state === "Present" ? "green" : state === "Late" ? "amber" : "red"}>
                        {state}
                      </Tag>
                    }
                  />
                ))}
              </section>
            </>
          ) : null}
        </Drawer>
      ) : null}

      {adding ? (
        <Modal
          title="Add a child"
          sub="Enrol a child and capture the parent's details."
          onClose={closeAdd}
          size="lg"
          footer={
            <>
              <Btn variant="outline" onClick={closeAdd}>
                Cancel
              </Btn>
              <Btn
                icon="check"
                onClick={() => {
                  closeAdd();
                  toast("Child added to the roster");
                }}
              >
                Add child
              </Btn>
            </>
          }
        >
          <div className="dfield-2">
            <label className="dfield">
              <span>Child's full name</span>
              <input placeholder="e.g. Aarav Shah" />
            </label>
            <label className="dfield">
              <span>Date of birth</span>
              <input type="date" />
            </label>
            <label className="dfield">
              <span>Classroom</span>
              <select defaultValue="">
                <option value="">Select a classroom</option>
                {classroomNames.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="dfield">
              <span>Fee plan</span>
              <select defaultValue="">
                <option value="">Select a plan</option>
                <option>Full-day</option>
                <option>Half-day</option>
              </select>
            </label>
            <label className="dfield">
              <span>Parent name</span>
              <input placeholder="e.g. Priya Shah" />
            </label>
            <label className="dfield">
              <span>Parent mobile</span>
              <input placeholder="+91 98765 43210" />
            </label>
          </div>

          <label className="dfield">
            <span>Allergies or medical notes</span>
            <textarea placeholder="Anything the teachers should know on day one" />
          </label>
        </Modal>
      ) : null}
    </>
  );
}
