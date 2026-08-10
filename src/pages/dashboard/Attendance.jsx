import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import { Btn, PageHead, Panel, Search, Select, StatCard, Tabs, Tag, Who } from "../../components/dash/ui.jsx";
import DataTable from "../../components/dash/DataTable.jsx";
import { BarChart } from "../../components/dash/Charts.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import {
  attendanceStatusTone,
  monthlySummary,
  todayRegister,
  weeklyAttendance,
} from "../../data/dash/attendance.js";
import { classroomNames } from "../../data/dash/seed.js";
import { todayLabel } from "../../data/dash/overview.js";

const STATES = ["Present", "Late", "Absent", "On leave"];

export default function Attendance() {
  const toast = useToast();
  const [tab, setTab] = useState("today");
  const [register, setRegister] = useState(todayRegister);
  const [query, setQuery] = useState("");
  const [room, setRoom] = useState("");
  const [dirty, setDirty] = useState(false);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return register.filter((record) => {
      if (room && record.classroom !== room) return false;
      return !needle || record.name.toLowerCase().includes(needle);
    });
  }, [register, query, room]);

  const counts = useMemo(
    () =>
      register.reduce(
        (totals, record) => {
          const key = record.status.toLowerCase().replace(" ", "");
          totals[key] = (totals[key] || 0) + 1;
          return totals;
        },
        { present: 0, late: 0, absent: 0, onleave: 0 }
      ),
    [register]
  );

  const setStatus = (id, status) => {
    setDirty(true);
    setRegister((current) =>
      current.map((record) =>
        record.id === id
          ? {
              ...record,
              status,
              checkIn:
                status === "Present" || status === "Late"
                  ? record.checkIn === "—"
                    ? new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
                    : record.checkIn
                  : "—",
            }
          : record
      )
    );
  };

  const markAll = (status) => {
    setDirty(true);
    setRegister((current) =>
      current.map((record) =>
        !room || record.classroom === room ? { ...record, status } : record
      )
    );
    toast(`Marked ${room || "everyone"} as ${status.toLowerCase()}`);
  };

  const todayColumns = [
    { key: "name", header: "Child", render: (row) => <Who name={row.name} sub={row.classroom} size={34} /> },
    {
      key: "status",
      header: "Attendance",
      width: 320,
      render: (row) => (
        <div className="segrow">
          {STATES.map((state) => (
            <button
              key={state}
              type="button"
              className={`seg ${row.status === state ? `is-on seg--${attendanceStatusTone[state]}` : ""}`.trim()}
              onClick={(event) => {
                event.stopPropagation();
                setStatus(row.id, state);
              }}
            >
              {state === "On leave" ? "Leave" : state}
            </button>
          ))}
        </div>
      ),
    },
    { key: "checkIn", header: "Check-in", render: (row) => <span className="nowrap">{row.checkIn}</span> },
    { key: "checkOut", header: "Check-out", render: (row) => <span className="nowrap">{row.checkOut}</span> },
    {
      key: "flags",
      header: "Notes",
      render: (row) => (
        <span className="muted" style={{ fontSize: 13 }}>
          {row.earlyPickup ? (
            <Tag tone="blue">Early pickup</Tag>
          ) : row.note ? (
            row.note
          ) : row.pickedBy !== "—" ? (
            `Pickup: ${row.pickedBy}`
          ) : (
            "—"
          )}
        </span>
      ),
    },
  ];

  const historyColumns = [
    { key: "dateLabel", header: "Date" },
    { key: "present", header: "Present", align: "right" },
    { key: "absent", header: "Absent", align: "right" },
    { key: "late", header: "Late", align: "right" },
    {
      key: "rate",
      header: "Rate",
      align: "right",
      render: (row) => (
        <Tag tone={row.rate >= 92 ? "green" : row.rate >= 85 ? "amber" : "red"}>{row.rate}%</Tag>
      ),
    },
  ];

  return (
    <>
      <PageHead title="Attendance" sub={todayLabel}>
        <Btn variant="outline" icon="download" onClick={() => toast("Attendance sheet downloaded")}>
          Export
        </Btn>
        <Btn
          icon="check"
          disabled={!dirty}
          onClick={() => {
            setDirty(false);
            toast("Attendance saved and shared with parents");
          }}
        >
          {dirty ? "Save register" : "Register saved"}
        </Btn>
      </PageHead>

      <div className="stats">
        <StatCard icon="checkCircle" tone="green" label="Present" value={counts.present} />
        <StatCard icon="clock" tone="amber" label="Late arrivals" value={counts.late} />
        <StatCard icon="xCircle" tone="red" label="Absent" value={counts.absent} />
        <StatCard icon="calendar" tone="blue" label="On planned leave" value={counts.onleave} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "today", label: "Today's register" },
            { id: "history", label: "History" },
            { id: "monthly", label: "Monthly report" },
          ]}
        />
      </div>

      {tab === "today" ? (
        <>
          <div className="toolbar">
            <Search value={query} onChange={setQuery} placeholder="Find a child..." />
            <Select value={room} onChange={setRoom} options={classroomNames} placeholder="All classrooms" />
            <div className="toolbar__spacer" />
            <Btn variant="soft" size="sm" icon="checkSquare" onClick={() => markAll("Present")}>
              Mark all present
            </Btn>
            <Btn variant="outline" size="sm" icon="refresh" onClick={() => { setRegister(todayRegister); setDirty(false); }}>
              Reset
            </Btn>
          </div>

          <Panel
            title={room || "All classrooms"}
            badge={{ label: `${rows.length} children`, tone: "brand" }}
            flush
          >
            <DataTable columns={todayColumns} rows={rows} />
          </Panel>
        </>
      ) : null}

      {tab === "history" ? (
        <div className="dcols dcols--main">
          <Panel title="Daily attendance" sub="Last 22 working days" flush>
            <DataTable columns={historyColumns} rows={monthlySummary} />
          </Panel>
          <Panel title="This week" sub="Children present per day">
            <BarChart data={weeklyAttendance} color="#16a34a" height={230} />
          </Panel>
        </div>
      ) : null}

      {tab === "monthly" ? (
        <div className="dcols dcols--2">
          <Panel title="August 2026 summary">
            <ul className="statlist">
              <li>
                <span>Average daily attendance</span>
                <strong>91%</strong>
              </li>
              <li>
                <span>Best day</span>
                <strong>Tue 4 Aug — 124 present</strong>
              </li>
              <li>
                <span>Lowest day</span>
                <strong>Mon 3 Aug — 104 present</strong>
              </li>
              <li>
                <span>Children with perfect attendance</span>
                <strong>38</strong>
              </li>
              <li>
                <span>Children below 75%</span>
                <strong>6</strong>
              </li>
            </ul>
            <Btn
              variant="outline"
              icon="printer"
              className="dbtn--block"
              onClick={() => toast("Monthly report queued for download")}
            >
              Download monthly report
            </Btn>
          </Panel>

          <Panel title="Needs a follow-up" sub="Attendance under 75% this month">
            <ul className="feed">
              {register.slice(0, 6).map((record) => (
                <li key={record.id}>
                  <div className="feed__row">
                    <span className="feed__icon tone-red">
                      <Icon name="alertCircle" size={15} />
                    </span>
                    <span className="feed__text">
                      <strong>{record.name}</strong>
                      <span>
                        {record.classroom} · {62 + (record.name.length % 12)}% attendance
                      </span>
                    </span>
                    <Btn size="sm" variant="soft" onClick={() => toast(`Message sent about ${record.name}`)}>
                      Contact
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      ) : null}
    </>
  );
}
