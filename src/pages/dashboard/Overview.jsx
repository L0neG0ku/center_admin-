import { Link, useNavigate } from "react-router-dom";
import Icon from "../../icons/Icon.jsx";
import { Panel, PageHead, StatCard, Tag, Who } from "../../components/dash/ui.jsx";
import { AreaChart, BarChart, Donut, RankBars } from "../../components/dash/Charts.jsx";
import DataTable, { TableFoot } from "../../components/dash/DataTable.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import { attendanceCounts, weeklyAttendance } from "../../data/dash/attendance.js";
import { staffOnDuty } from "../../data/dash/staff.js";
import { children, classroomCounts } from "../../data/dash/children.js";
import { billingSummary, collectionLabels, collectionTrend } from "../../data/dash/billing.js";
import { admissionRequests, admissionStages } from "../../data/dash/admissions.js";
import { upcoming, eventTypes } from "../../data/dash/calendar.js";
import {
  greetingFor,
  notifications,
  pendingFeesPreview,
  recentActivity,
  sparks,
  todayLabel,
} from "../../data/dash/overview.js";
import { fmtMoney } from "../../data/dash/seed.js";

/** Colours shared by the classroom donut so it reads as one palette. */
const classroomPalette = ["#7c3aed", "#3b82f6", "#16a34a", "#ec4899", "#f59e0b"];
const stageTones = {
  New: "#7c3aed",
  "In review": "#3b82f6",
  Approved: "#16a34a",
  Waitlisted: "#f59e0b",
  Rejected: "#ef4444",
};

const quickTiles = [
  {
    id: "attendance",
    icon: "checkSquare",
    tone: "green",
    title: "Take attendance",
    body: "Mark today's register",
    to: "/dashboard/attendance",
  },
  {
    id: "child",
    icon: "userPlus",
    tone: "brand",
    title: "Add a child",
    body: "Enrol a new family",
    to: "/dashboard/children?new=1",
  },
  {
    id: "announce",
    icon: "megaphone",
    tone: "pink",
    title: "Send an announcement",
    body: "Reach every parent",
    to: "/dashboard/announcements?new=1",
  },
];

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const enrolled = children.filter((child) => child.status !== "Graduating").length;
  const outstanding = billingSummary.pending + billingSummary.overdue;
  const outstandingCount = billingSummary.pendingCount + billingSummary.overdueCount;

  const attendanceSegments = [
    { label: "Present", value: attendanceCounts.present, color: "#16a34a" },
    { label: "Late", value: attendanceCounts.late, color: "#f59e0b" },
    { label: "Absent", value: attendanceCounts.absent, color: "#ef4444" },
    { label: "On leave", value: attendanceCounts.onleave, color: "#3b82f6" },
  ];

  // Enrolment split by classroom, for the donut.
  const classroomSegments = classroomCounts.map((room, index) => ({
    label: room.name,
    value: room.enrolled,
    color: classroomPalette[index % classroomPalette.length],
  }));

  // Admissions pipeline — how many requests sit in each stage.
  const admissionByStage = admissionStages
    .map((stage) => ({
      label: stage,
      value: admissionRequests.filter((request) => request.status === stage).length,
      color: stageTones[stage],
    }))
    .filter((row) => row.value > 0);

  const feeColumns = [
    {
      key: "child",
      header: "Child",
      render: (row) => <Who name={row.child} sub={row.parent} size={34} />,
    },
    { key: "amount", header: "Amount", render: (row) => fmtMoney(row.amount) },
    {
      key: "due",
      header: "Due",
      render: (row) => (
        <span className={row.status === "Overdue" ? "" : "muted"}>{row.due}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Tag tone={row.status === "Overdue" ? "red" : "amber"} dot>
          {row.status}
        </Tag>
      ),
    },
    {
      key: "action",
      header: "",
      align: "right",
      render: () => (
        <button type="button" className="dbtn dbtn--soft dbtn--sm">
          Remind
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHead
        title={`${greetingFor()}, ${String(user?.name ?? "").split(" ")[0] || "there"}! 👋`}
        sub={`Here's what's happening at ${user?.centre || "your centre"} today.`}
      >
        <span className="dchip">
          <Icon name="calendar" size={16} />
          {todayLabel}
        </span>
      </PageHead>

      <div className="stats">
        <StatCard
          icon="baby"
          tone="brand"
          label="Children Enrolled"
          value={enrolled}
          delta={{ dir: "up", text: "4 joined this month" }}
          series={sparks.enrolled}
        />
        <StatCard
          icon="checkCircle"
          tone="green"
          label="Present Today"
          value={attendanceCounts.present + attendanceCounts.late}
          delta={{ dir: "up", text: `${Math.round(((attendanceCounts.present + attendanceCounts.late) / attendanceCounts.total) * 100)}% of the register` }}
          series={sparks.present}
        />
        <StatCard
          icon="xCircle"
          tone="red"
          label="Absent Today"
          value={attendanceCounts.absent}
          delta={{ dir: "down", text: `${attendanceCounts.onleave} on planned leave` }}
          series={sparks.absent}
        />
        <StatCard
          icon="users"
          tone="blue"
          label="Staff on Duty"
          value={staffOnDuty}
          delta={{ dir: "flat", text: "2 away today" }}
          series={sparks.staff}
        />
        <StatCard
          icon="wallet"
          tone="amber"
          label="Pending Fees"
          value={fmtMoney(outstanding)}
          delta={{ dir: "down", text: `${outstandingCount} invoices` }}
          series={sparks.fees}
        />
      </div>

      <ul className="qtiles">
        {quickTiles.map((tile) => (
          <li key={tile.id}>
            <Link to={tile.to}>
              <span className={`qtiles__icon tone-${tile.tone}`}>
                <Icon name={tile.icon} size={21} />
              </span>
              <span className="qtiles__text">
                <strong>{tile.title}</strong>
                <span>{tile.body}</span>
              </span>
              <Icon name="arrowRight" size={17} className="muted" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="dcols dcols--3 charts-row">
        <Panel
          title="Fee collections"
          sub="Collected each month (₹ lakh)"
          action={{ label: "Billing", onClick: () => navigate("/dashboard/billing") }}
        >
          <AreaChart
            points={collectionTrend}
            labels={collectionLabels}
            color="#16a34a"
            height={200}
            formatY={(value) => `${value}L`}
          />
        </Panel>

        <Panel
          title="Enrolment by classroom"
          sub={`${children.filter((child) => child.status !== "Graduating").length} children on register`}
          action={{ label: "Children", onClick: () => navigate("/dashboard/children") }}
        >
          <div className="donut-row">
            <Donut
              segments={classroomSegments}
              size={150}
              centre={{ value: classroomSegments.reduce((sum, s) => sum + s.value, 0), label: "Enrolled" }}
            />
            <ul className="legend">
              {classroomSegments.map((segment) => (
                <li key={segment.label}>
                  <span className="legend__swatch" style={{ background: segment.color }} />
                  <span className="legend__label">{segment.label}</span>
                  <span className="legend__value">{segment.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel
          title="Admissions pipeline"
          sub="Requests by stage"
          action={{ label: "Admissions", onClick: () => navigate("/dashboard/admissions") }}
        >
          <RankBars data={admissionByStage} />
        </Panel>
      </div>

      <Panel
        title="Attendance this week"
        sub="Children marked present, Monday to Sunday"
        action={{ label: "Open attendance", onClick: () => navigate("/dashboard/attendance") }}
        className="panel--span"
      >
        <div className="attend-split">
          <BarChart data={weeklyAttendance} color="#7c3aed" height={210} />
          <div className="attend-side">
            <Donut
              segments={attendanceSegments}
              size={150}
              centre={{ value: attendanceCounts.total, label: "On register" }}
            />
            <ul className="legend">
              {attendanceSegments.map((segment) => (
                <li key={segment.label}>
                  <span className="legend__swatch" style={{ background: segment.color }} />
                  <span className="legend__label">{segment.label}</span>
                  <span className="legend__value">{segment.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      <div className="dcols dcols--main">
        <div className="dstack">
          <Panel
            title="Needs your attention"
            badge={{ label: `${notifications.length} new`, tone: "brand" }}
          >
            <ul className="feed">
              {notifications.map((item) => (
                <li key={item.id}>
                  <Link to={item.to}>
                    <span className="feed__icon tone-amber">
                      <Icon name={item.icon} size={16} />
                    </span>
                    <span className="feed__text">
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                      <small>{item.at}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Pending fee collections"
            badge={{ label: `${outstandingCount} unpaid`, tone: "amber" }}
            action={{ label: "View all", onClick: () => navigate("/dashboard/billing") }}
            flush
          >
            <DataTable columns={feeColumns} rows={pendingFeesPreview} />
            <div style={{ padding: "0 22px" }}>
              <TableFoot onClick={() => navigate("/dashboard/billing")}>
                View all {outstandingCount} pending invoices
              </TableFoot>
            </div>
          </Panel>
        </div>

        <div className="dstack">
          <Panel
            title="Upcoming"
            sub="Birthdays and events, merged"
            action={{ label: "Calendar", onClick: () => navigate("/dashboard/calendar") }}
          >
            <ul className="feed">
              {upcoming.map((event) => {
                const meta = eventTypes[event.type];
                return (
                  <li key={event.id}>
                    <div className="feed__row">
                      <span className={`feed__icon tone-${meta.tone}`}>
                        <Icon name={meta.icon} size={16} />
                      </span>
                      <span className="feed__text">
                        <strong>{event.title}</strong>
                        <span>
                          {event.date.toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          · {event.time}
                        </span>
                      </span>
                      <Tag tone={meta.tone}>{event.type}</Tag>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Recent activity">
            <ul className="feed feed--tight">
              {recentActivity.map((item) => (
                <li key={item.id}>
                  <div className="feed__row">
                    <span className={`feed__icon tone-${item.tone}`}>
                      <Icon name={item.icon} size={15} />
                    </span>
                    <span className="feed__text">
                      <strong>{item.text}</strong>
                      <small>{item.at}</small>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
