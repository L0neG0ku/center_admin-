import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Avatar,
  Btn,
  Fact,
  PageHead,
  Panel,
  Search,
  StatCard,
  Tabs,
  Tag,
  Who,
} from "../../components/dash/ui.jsx";
import DataTable from "../../components/dash/DataTable.jsx";
import { Drawer } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import {
  admissionRequests,
  admissionStatusTone,
  seatAvailability,
} from "../../data/dash/admissions.js";

const TABS = [
  { id: "all", label: "All" },
  { id: "New", label: "New" },
  { id: "In review", label: "In review" },
  { id: "Approved", label: "Approved" },
  { id: "Waitlisted", label: "Waiting list" },
  { id: "Rejected", label: "Rejected" },
];

export default function Admissions() {
  const toast = useToast();
  const [requests, setRequests] = useState(admissionRequests);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const counts = useMemo(
    () =>
      requests.reduce((totals, request) => {
        totals[request.status] = (totals[request.status] || 0) + 1;
        return totals;
      }, {}),
    [requests]
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((request) => {
      if (tab !== "all" && request.status !== tab) return false;
      return (
        !needle ||
        request.childName.toLowerCase().includes(needle) ||
        request.parentName.toLowerCase().includes(needle)
      );
    });
  }, [requests, tab, query]);

  const decide = (id, status, message) => {
    setRequests((current) =>
      current.map((request) => (request.id === id ? { ...request, status } : request))
    );
    setSelected(null);
    toast(message);
  };

  const columns = [
    {
      key: "childName",
      header: "Child",
      render: (row) => <Who name={row.childName} sub={`${row.ageLabel} · ${row.classroom}`} />,
    },
    {
      key: "parentName",
      header: "Parent",
      render: (row) => (
        <span>
          {row.parentName}
          <br />
          <span className="muted" style={{ fontSize: 12.5 }}>
            {row.phone}
          </span>
        </span>
      ),
    },
    { key: "source", header: "Came from" },
    { key: "appliedLabel", header: "Applied", render: (row) => <span className="nowrap">{row.appliedLabel}</span> },
    { key: "startsLabel", header: "Wants to start", render: (row) => <span className="nowrap">{row.startsLabel}</span> },
    {
      key: "documents",
      header: "Documents",
      render: (row) => {
        const received = row.documents.filter((doc) => doc.status === "Received").length;
        return (
          <Tag tone={received === row.documents.length ? "green" : "amber"}>
            {received}/{row.documents.length}
          </Tag>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Tag tone={admissionStatusTone[row.status]} dot>
          {row.status}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <PageHead title="Admissions" sub="Enquiries from the Kribble parent app, walk-ins and referrals">
        <Btn variant="outline" icon="download" onClick={() => toast("Admissions report exported")}>
          Export
        </Btn>
        <Btn icon="plus" onClick={() => toast("Manual enquiry form opens with the backend")}>
          Add enquiry
        </Btn>
      </PageHead>

      <div className="stats">
        <StatCard icon="userPlus" tone="brand" label="New requests" value={counts.New || 0} delta={{ dir: "up", text: "2 since yesterday" }} />
        <StatCard icon="clipboard" tone="amber" label="In review" value={counts["In review"] || 0} />
        <StatCard icon="checkCircle" tone="green" label="Approved" value={counts.Approved || 0} />
        <StatCard icon="clock" tone="blue" label="On the waiting list" value={counts.Waitlisted || 0} />
      </div>

      <div className="dcols dcols--main" style={{ marginBottom: 18 }}>
        <div>
          <div className="toolbar">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={TABS.map((entry) => ({
                ...entry,
                count: entry.id === "all" ? requests.length : counts[entry.id] || 0,
              }))}
            />
            <div className="toolbar__spacer" />
            <Search value={query} onChange={setQuery} placeholder="Search by child or parent..." />
          </div>

          <Panel title="Requests" badge={{ label: `${rows.length} shown`, tone: "brand" }} flush>
            <DataTable
              columns={columns}
              rows={rows}
              onRowClick={setSelected}
              selectedId={selected?.id}
              empty={{ title: "Nothing in this stage", body: "Requests will appear here as parents apply." }}
            />
          </Panel>
        </div>

        <Panel title="Seats available" sub="Capacity against current enrolment">
          <ul className="seatlist">
            {seatAvailability.map((room) => (
              <li key={room.id}>
                <div className="seatlist__head">
                  <strong>{room.name}</strong>
                  <span className={room.free <= 1 ? "seat-full" : "muted"}>
                    {room.free} free
                  </span>
                </div>
                <div className="dbar">
                  <span
                    style={{
                      width: `${(room.enrolled / room.capacity) * 100}%`,
                      background: room.free <= 1 ? "var(--danger)" : "var(--brand-600)",
                    }}
                  />
                </div>
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {room.enrolled} of {room.capacity} seats · {room.ageGroup}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {selected ? (
        <Drawer
          title="Admission request"
          sub={selected.id}
          onClose={() => setSelected(null)}
          footer={
            selected.status === "Approved" || selected.status === "Rejected" ? (
              <Btn variant="outline" onClick={() => setSelected(null)}>
                Close
              </Btn>
            ) : (
              <>
                <Btn
                  variant="danger"
                  onClick={() => decide(selected.id, "Rejected", "Request declined and the parent notified")}
                >
                  Decline
                </Btn>
                <Btn
                  variant="outline"
                  onClick={() => decide(selected.id, "Waitlisted", "Moved to the waiting list")}
                >
                  Waitlist
                </Btn>
                <Btn
                  icon="check"
                  onClick={() => decide(selected.id, "Approved", `${selected.childName} approved for ${selected.classroom}`)}
                >
                  Approve
                </Btn>
              </>
            )
          }
        >
          <div className="dident">
            <Avatar name={selected.childName} size={48} />
            <div className="dident__text">
              <strong>{selected.childName}</strong>
              <span>
                {selected.ageLabel} · {selected.classroom}
              </span>
            </div>
            <Tag tone={admissionStatusTone[selected.status]} dot>
              {selected.status}
            </Tag>
          </div>

          <section className="dsec">
            <h3>Parent</h3>
            <div className="dgrid">
              <Fact label="Name" value={selected.parentName} />
              <Fact label="Mobile" value={selected.phone} />
              <Fact label="Email" value={selected.email} />
              <Fact label="Came from" value={selected.source} />
            </div>
          </section>

          <section className="dsec">
            <h3>Request</h3>
            <div className="dgrid">
              <Fact label="Applied on" value={selected.appliedLabel} />
              <Fact label="Preferred start" value={selected.startsLabel} />
              <Fact label="Classroom" value={selected.classroom} />
              <Fact label="Fee plan" value={selected.feePlan} />
            </div>
            {selected.note ? <p className="note-box" style={{ marginTop: 14 }}>{selected.note}</p> : null}
          </section>

          <section className="dsec">
            <h3>Required documents</h3>
            <ul className="doclist">
              {selected.documents.map((doc) => (
                <li key={doc.name}>
                  <span className={`mini-card__icon ${doc.status === "Received" ? "tone-green" : "tone-amber"}`}>
                    <Icon name={doc.status === "Received" ? "fileCheck" : "fileText"} size={16} />
                  </span>
                  <div>
                    <strong>{doc.name}</strong>
                    <span className="muted">
                      {doc.status === "Received" ? "Uploaded by the parent" : "Still to be collected"}
                    </span>
                  </div>
                  <Tag tone={doc.status === "Received" ? "green" : "amber"}>{doc.status}</Tag>
                </li>
              ))}
            </ul>
          </section>
        </Drawer>
      ) : null}
    </>
  );
}
