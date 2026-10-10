import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Empty,
  PageHead,
  Panel,
  Search,
  Select,
  StatCard,
  Tabs,
  Tag,
  Who,
} from "../../components/dash/ui.jsx";
import DataTable from "../../components/dash/DataTable.jsx";
import { BarChart } from "../../components/dash/Charts.jsx";
import * as api from "../../api/endpoints.js";
import { useResource } from "../../api/useResource.js";

/**
 * The owner's view of the register the staff app fills.
 *
 * THIS PAGE IS READ-ONLY, AND HAS TO BE. The owner has exactly two attendance
 * endpoints — `GET /daycares/me/attendance` and `.../summary` — and no write.
 * Marking attendance is a caretaker action, scoped to their rooms, carrying a
 * timestamp and a collector: `/caretaker/attendance/check-in`, `check-out`,
 * `absent`, and an audited `PATCH` for corrections.
 *
 * So the per-child Present/Late/Absent/Leave buttons, "mark everyone present"
 * and "Save register" are gone. None of them could have reached the API, and
 * an owner tapping them and seeing "Attendance saved and shared with parents"
 * would have been told something false about a child's day.
 *
 * Also gone: "Late" as a fourth status. The enum is PRESENT / ABSENT /
 * ON_LEAVE; `late` is a separate boolean on a present record, so it is shown
 * as a flag beside Present rather than instead of it.
 *
 * What the owner gets instead is the thing they cannot get anywhere else: how
 * many children nobody has marked yet, which rooms are behind, and every
 * unauthorised pickup.
 */

const statusTone = { PRESENT: "green", ABSENT: "red", ON_LEAVE: "blue" };
const statusLabel = { PRESENT: "Present", ABSENT: "Absent", ON_LEAVE: "On leave" };

const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

/** A time on the CENTRE's clock — Asia/Kolkata — not the reader's. */
const timeLabel = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : null;

const longDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function Attendance() {
  const [tab, setTab] = useState("today");
  const [date, setDate] = useState(isoDate(new Date()));
  const [query, setQuery] = useState("");
  const [room, setRoom] = useState("");

  const registerCall = useResource(
    (signal) => api.getAttendance({ date }, { signal }),
    [date]
  );
  const roomsCall = useResource((signal) => api.listClassrooms({ signal }), []);
  // The register only contains children somebody has marked. Naming the ones
  // nobody has needs the roster as well — and that is the question an owner
  // actually opens this page with at half past nine.
  const rosterCall = useResource(
    (signal) => api.listAllChildren({ status: "ACTIVE" }, { signal }),
    []
  );

  const register = registerCall.data || null;
  const records = useMemo(() => register?.records || [], [register]);
  const rooms = useMemo(() => roomsCall.data || [], [roomsCall.data]);

  const unmarked = useMemo(() => {
    const roster = rosterCall.data || [];
    if (!roster.length || !register) return [];
    const marked = new Set(records.map((record) => record.child_id));
    return roster
      .filter((child) => !marked.has(child.id))
      .map((child) => ({
        id: child.id,
        name: child.name,
        room: child.enrollment?.classroom?.name || "",
        roomId: child.enrollment?.classroom_id || "",
      }));
  }, [rosterCall.data, register, records]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      if (room && record.classroom_id !== room) return false;
      return !needle || (record.child_name || "").toLowerCase().includes(needle);
    });
  }, [records, query, room]);

  const unauthorised = records.filter((record) => record.unauthorised_pickup);
  const lateCount = records.filter(
    (record) => record.late && record.status === "PRESENT"
  ).length;

  const columns = [
    {
      key: "child",
      header: "Child",
      render: (row) => (
        <Who name={row.child_name} sub={row.classroom_name} size={34} />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <Tag tone={statusTone[row.status] || "grey"} dot>
            {statusLabel[row.status] || row.status}
          </Tag>
          {/* A flag, not a status — see the note at the top of this file. */}
          {row.late && row.status === "PRESENT" ? (
            <Tag tone="amber">Late</Tag>
          ) : null}
        </span>
      ),
    },
    {
      key: "checkIn",
      header: "Check-in",
      render: (row) => (
        <span className="nowrap">{timeLabel(row.check_in_at) || "—"}</span>
      ),
    },
    {
      key: "checkOut",
      header: "Check-out",
      render: (row) => (
        <span className="nowrap">{timeLabel(row.check_out_at) || "—"}</span>
      ),
    },
    {
      key: "collected",
      header: "Collected by",
      render: (row) => {
        const who = row.pickup_person?.name || row.collector_name;
        if (!who) return <span className="muted">—</span>;
        return (
          <span>
            {who}
            {row.unauthorised_pickup ? (
              <>
                <br />
                <Tag tone="red">Not on the authorised list</Tag>
              </>
            ) : null}
          </span>
        );
      },
    },
    {
      key: "note",
      header: "Reason / note",
      render: (row) => {
        // The parent's own words first — they wrote them, and a caretaker
        // chasing the family needs to know the centre was already told.
        const reason = row.parent_absence_notice || row.note;
        if (!reason) return <span className="muted">—</span>;
        return (
          <span className="muted" style={{ fontSize: 13 }}>
            {row.parent_absence_notice ? "Parent: " : ""}
            {reason}
          </span>
        );
      },
    },
  ];

  // `total` on the register envelope is NOT the number of enrolled children —
  // the API sets it to `len(records)`, so `total - records.length` is always
  // exactly zero and "Not marked" would have read 0 even when nobody had
  // marked anybody. The only honest source is the roster diff below.
  const rosterSize = (rosterCall.data || []).length;
  const rosterKnown = Boolean(rosterCall.data) && Boolean(register);
  const notMarked = rosterKnown ? unmarked.length : null;

  return (
    <>
      <PageHead
        title="Attendance"
        sub={
          registerCall.loading
            ? "Loading the register..."
            : `${longDate(date)} · recorded by your caretakers`
        }
      >
        <label className="dfield" style={{ margin: 0 }}>
          <input
            type="date"
            value={date}
            max={isoDate(new Date())}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </PageHead>

      {/* Said once, plainly. An owner looking for a Save button should know
          why there is not one. */}
      <p className="note-box" style={{ marginBottom: 16 }}>
        <Icon name="helpCircle" size={15} /> Caretakers mark the register in the
        Kribble staff app. This is your view of it — you cannot change a
        child&rsquo;s attendance from here.
      </p>

      {registerCall.error ? (
        <Panel>
          <Empty
            icon="alertTriangle"
            title="Could not load the register"
            body={registerCall.error.message}
            action={
              <Btn variant="outline" onClick={registerCall.reload}>
                Try again
              </Btn>
            }
          />
        </Panel>
      ) : (
        <>
          <div className="stats">
            <StatCard
              icon="checkCircle"
              tone="green"
              label="Present"
              value={register?.present ?? "—"}
            />
            <StatCard
              icon="xCircle"
              tone="red"
              label="Absent"
              value={register?.absent ?? "—"}
            />
            <StatCard
              icon="calendar"
              tone="blue"
              label="On leave"
              value={register?.on_leave ?? "—"}
            />
            {/* The number that needs acting on, so it gets the warning tone
                only when it is non-zero. */}
            <StatCard
              icon="alertTriangle"
              tone={notMarked ? "amber" : "grey"}
              label="Not marked"
              value={notMarked ?? "—"}
            />
          </div>

          {unauthorised.length > 0 ? (
            <p
              className="note-box"
              style={{ marginBottom: 16, borderColor: "var(--danger)" }}
            >
              <Icon name="alertTriangle" size={15} />{" "}
              <strong>
                {unauthorised.length === 1
                  ? "One child was collected"
                  : `${unauthorised.length} children were collected`}{" "}
                by someone not on the authorised list
              </strong>{" "}
              — {unauthorised.map((r) => r.child_name).join(", ")}. Confirm
              each one with the parent before the end of the day.
            </p>
          ) : null}

          <div style={{ marginBottom: 18 }}>
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { id: "today", label: "Register" },
                {
                  id: "unmarked",
                  label: "Not marked",
                  count: notMarked || undefined,
                },
                { id: "history", label: "History" },
              ]}
            />
          </div>

          {tab === "today" ? (
            <>
              <div className="toolbar">
                <Search
                  value={query}
                  onChange={setQuery}
                  placeholder="Search by child name..."
                />
                <Select
                  value={room}
                  onChange={setRoom}
                  options={rooms.map((entry) => ({
                    value: entry.id,
                    label: entry.name,
                  }))}
                  placeholder="All classrooms"
                />
                <div className="toolbar__spacer" />
                {lateCount > 0 ? (
                  <span className="muted" style={{ fontSize: 13 }}>
                    {lateCount} late {lateCount === 1 ? "arrival" : "arrivals"}
                  </span>
                ) : null}
              </div>

              <Panel
                title="Register"
                badge={{ label: `${rows.length} shown`, tone: "brand" }}
                flush
              >
                {registerCall.loading ? (
                  <Empty
                    icon="checkSquare"
                    title="Loading..."
                    body="Fetching the register."
                  />
                ) : records.length === 0 ? (
                  <Empty
                    icon="checkSquare"
                    title="Nothing marked yet"
                    body={
                      rosterSize > 0
                        ? `No caretaker has marked any of your ${rosterSize} children for this date.`
                        : "No children are enrolled yet."
                    }
                  />
                ) : (
                  <DataTable
                    columns={columns}
                    rows={rows}
                    rowKey={(row) => row.id}
                    empty={{
                      title: "Nobody matches those filters",
                      body: "Try clearing the room or the search.",
                    }}
                  />
                )}
              </Panel>
            </>
          ) : null}

          {tab === "unmarked" ? (
            <UnmarkedPanel
              unmarked={unmarked}
              loading={rosterCall.loading || registerCall.loading}
              error={rosterCall.error}
              notMarked={notMarked}
            />
          ) : null}

          {tab === "history" ? <HistoryPanels /> : null}
        </>
      )}
    </>
  );
}

/**
 * Who nobody has marked, grouped by room.
 *
 * Diffed from the roster against the register: the register only contains
 * children somebody has already marked, so an unmarked child has no row in it
 * at all. The envelope's `total` cannot help — the API sets it to the record
 * count, so it can never reveal a missing child.
 */
function UnmarkedPanel({ unmarked, loading, error, notMarked }) {
  const byRoom = useMemo(() => {
    const groups = new Map();
    unmarked.forEach((child) => {
      const key = child.room || "No room assigned";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(child);
    });
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [unmarked]);

  if (loading) {
    return (
      <Panel title="Not marked">
        <Empty icon="clock" title="Loading..." body="Comparing the roster to the register." />
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel title="Not marked">
        <Empty
          icon="alertTriangle"
          title="Could not load the roster"
          body={`${error.message} The count above still comes from the register.`}
        />
      </Panel>
    );
  }

  // notMarked is null until both the roster and the register have landed,
  // which the loading branch above already covers.
  if (!notMarked) {
    return (
      <Panel title="Not marked">
        <Empty
          icon="checkCircle"
          title="Everyone is accounted for"
          body="Every enrolled child has been marked for this date."
        />
      </Panel>
    );
  }

  return (
    <Panel
      title="Not marked"
      sub="Nobody has recorded these children — neither a caretaker nor their parent"
      badge={{ label: `${notMarked}`, tone: "amber" }}
    >
      {byRoom.map(([roomName, kids]) => (
          <section key={roomName} className="dsec">
            <h3>
              {roomName}{" "}
              <Tag tone="amber">
                {kids.length} {kids.length === 1 ? "child" : "children"}
              </Tag>
            </h3>
            <div className="dchips" style={{ marginTop: 8 }}>
              {kids.map((child) => (
                <span key={child.id} className="dchip">
                  {child.name}
                </span>
              ))}
            </div>
          </section>
      ))}
    </Panel>
  );
}

/** Daily totals over the last 30 days, from the summary endpoint. */
function HistoryPanels() {
  const [days, setDays] = useState(30);

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    return { from: isoDate(from), to: isoDate(to) };
  }, [days]);

  const call = useResource(
    (signal) =>
      api.getAttendanceSummary(
        { from: range.from, to: range.to },
        { signal }
      ),
    [range.from, range.to]
  );

  const rows = useMemo(() => {
    const summary = call.data?.days || [];
    return summary
      .map((day) => {
        const marked = day.present + day.absent + day.on_leave;
        return {
          id: day.date,
          date: day.date,
          dateLabel: new Date(day.date).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
          present: day.present,
          absent: day.absent,
          onLeave: day.on_leave,
          late: day.late,
          // Of the children marked, how many were in. A day nobody marked
          // has no rate rather than a 0% that looks like a closure.
          rate: marked > 0 ? Math.round((day.present / marked) * 100) : null,
        };
      })
      .reverse();
  }, [call.data]);

  const chartData = useMemo(
    () =>
      [...rows]
        .reverse()
        .slice(-14)
        .map((row) => ({
          label: new Date(row.date).toLocaleDateString("en-IN", {
            day: "numeric",
          }),
          value: row.present,
          date: row.dateLabel,
        })),
    [rows]
  );

  const columns = [
    { key: "dateLabel", header: "Date" },
    { key: "present", header: "Present", align: "right" },
    { key: "absent", header: "Absent", align: "right" },
    { key: "onLeave", header: "On leave", align: "right" },
    { key: "late", header: "Late", align: "right" },
    {
      key: "rate",
      header: "Rate",
      align: "right",
      render: (row) =>
        row.rate === null ? (
          <span className="muted">Not marked</span>
        ) : (
          <Tag
            tone={row.rate >= 92 ? "green" : row.rate >= 85 ? "amber" : "red"}
          >
            {row.rate}%
          </Tag>
        ),
    },
  ];

  if (call.error) {
    return (
      <Panel title="History">
        <Empty
          icon="alertTriangle"
          title="Could not load the history"
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
    <>
      <div className="toolbar">
        <Select
          value={String(days)}
          onChange={(value) => setDays(Number(value))}
          options={[
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
            { value: "90", label: "Last 90 days" },
          ]}
        />
        <div className="toolbar__spacer" />
      </div>

      <Panel
        title="Children present"
        sub={chartData.length ? "Last 14 days" : undefined}
      >
        {call.loading ? (
          <Empty icon="barChart" title="Loading..." body="Fetching the totals." />
        ) : chartData.length === 0 ? (
          <Empty
            icon="barChart"
            title="No attendance recorded yet"
            body="Totals appear once your caretakers start marking the register."
          />
        ) : (
          <BarChart data={chartData} color="#16a34a" height={230} />
        )}
      </Panel>

      <Panel title="Daily totals" sub={`${rows.length} days`} flush>
        {call.loading ? (
          <Empty icon="calendar" title="Loading..." body="Fetching the totals." />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            empty={{
              title: "Nothing recorded in this range",
              body: "Try a longer range.",
            }}
          />
        )}
      </Panel>
    </>
  );
}
