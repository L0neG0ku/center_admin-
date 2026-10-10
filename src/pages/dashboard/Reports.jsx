import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Empty,
  PageHead,
  Panel,
  Select,
  StatCard,
} from "../../components/dash/ui.jsx";
import DataTable from "../../components/dash/DataTable.jsx";
import * as api from "../../api/endpoints.js";
import { useResource } from "../../api/useResource.js";

/**
 * Attendance over a range, from `GET /daycares/me/attendance/summary`, plus
 * the recent-activity trail from `GET /daycares/me/activity`.
 *
 * WHAT CAME OUT OF THIS PAGE, because nothing computes it: revenue, fee
 * collection, occupancy forecasts, staff utilisation, parent engagement
 * scores and "insights". Every one of those was a mock number attached to a
 * real centre's name.
 *
 * The attendance rate uses marked days as the denominator, not calendar
 * days — weekends and holidays were never school days, and counting them
 * would make every centre look like it loses a third of its children.
 */

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

function isoDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function when(value) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

/** AUDIT_ACTION → something an owner would say. */
const ACTION_LABEL = {
  INCIDENT_REPORTED: "filed an incident report",
  INCIDENT_CORRECTED: "corrected an incident report",
  INCIDENT_REVIEWED: "signed off an incident report",
  ANNOUNCEMENT_SENT: "sent an announcement",
  ANNOUNCEMENT_WITHDRAWN: "withdrew an announcement",
  ATTENDANCE_CORRECTED: "corrected an attendance record",
  CARE_LOG_UPDATED: "edited a care log",
  CARE_LOG_DELETED: "deleted a care log",
  CHILD_CREATED: "added a child",
  CHILD_UPDATED: "edited a child's details",
  ENROLLMENT_UPDATED: "changed an enrolment",
  HEALTH_RECORD_CREATED: "added a health record",
};

export default function Reports() {
  const [range, setRange] = useState("30");

  const [today] = useState(() => isoDay(new Date()));
  const from = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - (Number(range) - 1));
    return isoDay(date);
  }, [range]);

  const summaryCall = useResource(
    (signal) => api.getAttendanceSummary({ from, to: today }, { signal }),
    [from, today]
  );
  const activityCall = useResource(
    (signal) => api.getCentreActivity({ per_page: 40 }, { signal }),
    []
  );

  const days = useMemo(
    () => summaryCall.data?.days || [],
    [summaryCall.data]
  );
  const activity = useMemo(
    () => activityCall.data || [],
    [activityCall.data]
  );

  const totals = useMemo(() => {
    const present = days.reduce((sum, day) => sum + day.present, 0);
    const absent = days.reduce((sum, day) => sum + day.absent, 0);
    const late = days.reduce((sum, day) => sum + day.late, 0);
    const marked = present + absent;
    // Days where anything at all was recorded. A centre that forgot the
    // register on Tuesday should see that, not have Tuesday averaged in as a
    // day everyone was away.
    const openDays = days.filter(
      (day) => day.present + day.absent + day.on_leave > 0
    ).length;
    return {
      present,
      absent,
      late,
      openDays,
      rate: marked ? Math.round((present / marked) * 100) : 0,
    };
  }, [days]);

  function exportCsv() {
    const header = "date,present,absent,on_leave,late\n";
    const body = days
      .map(
        (day) =>
          `${day.date},${day.present},${day.absent},${day.on_leave},${day.late}`
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${from}-to-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHead
        title="Reports"
        sub="Attendance over time, and what your team has been doing."
      >
        <Select value={range} onChange={setRange} options={RANGES} />
        <Btn
          variant="outline"
          icon="download"
          disabled={days.length === 0}
          onClick={exportCsv}
        >
          Export CSV
        </Btn>
      </PageHead>

      <div className="stats" style={{ marginBottom: 18 }}>
        <StatCard
          icon="checkSquare"
          tone="green"
          label="Attendance rate"
          value={`${totals.rate}%`}
        />
        <StatCard icon="users" label="Days present" value={totals.present} />
        <StatCard
          icon="xCircle"
          tone="amber"
          label="Days absent"
          value={totals.absent}
        />
        <StatCard
          icon="clock"
          tone="amber"
          label="Late arrivals"
          value={totals.late}
        />
      </div>

      <Panel
        title="Attendance by day"
        sub={`${totals.openDays} of ${days.length} days had anything recorded`}
      >
        {summaryCall.loading ? (
          <p className="note-box">Loading…</p>
        ) : summaryCall.error ? (
          <p className="note-box" style={{ borderColor: "var(--danger)" }}>
            {summaryCall.error.message}{" "}
            <button type="button" onClick={summaryCall.reload}>
              Try again
            </button>
          </p>
        ) : days.length === 0 ? (
          <Empty
            icon="barChart"
            title="Nothing recorded"
            body="Attendance appears here once caretakers start marking the register."
          />
        ) : (
          <DataTable
            columns={[
              { key: "date", header: "Date" },
              { key: "present", header: "Present" },
              { key: "absent", header: "Absent" },
              { key: "on_leave", header: "On leave" },
              { key: "late", header: "Late" },
            ]}
            rows={[...days].reverse().map((day) => ({
              id: day.date,
              date: new Date(day.date).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                timeZone: "Asia/Kolkata",
              }),
              present: day.present,
              absent: day.absent,
              on_leave: day.on_leave,
              late: day.late,
            }))}
          />
        )}
      </Panel>

      <Panel title="Recent activity" className="mt">
        {/* O2 is scoped by actor, so this is your own people. A parent's
            actions are not in it — audit_logs has no centre column to filter
            on, which is a gap rather than a decision. */}
        {activityCall.loading ? (
          <p className="note-box">Loading…</p>
        ) : activity.length === 0 ? (
          <Empty
            icon="activity"
            title="Nothing yet"
            body="What your staff do in Kribble shows up here."
          />
        ) : (
          <ul className="actlist">
            {activity.map((entry) => (
              <li key={entry.id}>
                <Icon name="activity" size={14} />
                <span>
                  <strong>{entry.actor_name || "Someone"}</strong>{" "}
                  {ACTION_LABEL[entry.action] ||
                    entry.action.toLowerCase().replace(/_/g, " ")}
                </span>
                <em>{when(entry.at)}</em>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
