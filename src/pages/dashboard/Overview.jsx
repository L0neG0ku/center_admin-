import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../../icons/Icon.jsx";
import {
  Btn,
  Empty,
  PageHead,
  Panel,
  StatCard,
  Who,
} from "../../components/dash/ui.jsx";
import { BarChart, Donut } from "../../components/dash/Charts.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import * as api from "../../api/endpoints.js";
import { useResource } from "../../api/useResource.js";

/**
 * The owner's landing page, composed from the endpoints that exist.
 *
 * WHAT CAME OFF IT, because there is no backend behind any of them: the
 * pending-fees table and the billing summary, the admissions pipeline donut,
 * upcoming calendar events, and the "recent activity" feed. Seven mock files
 * fed this page; four of them described features that do not exist. A
 * dashboard that looks full and is half invented is worse than a smaller one
 * that is true, because the owner makes decisions off it — "₹1,08,500
 * outstanding across 9 families" is a number someone would act on.
 *
 * What is here instead is one panel that could not exist before: everything
 * genuinely needing attention, assembled from signals the API does report.
 */

const CLASSROOM_PALETTE = [
  "#7c3aed",
  "#3b82f6",
  "#16a34a",
  "#ec4899",
  "#f59e0b",
  "#06b6d4",
];

const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const greetingFor = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = useMemo(() => isoDate(new Date()), []);

  const weekAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 13);
    return isoDate(date);
  }, []);

  const childrenCall = useResource(
    (signal) => api.listAllChildren({ status: "ACTIVE" }, { signal }),
    []
  );
  const registerCall = useResource(
    (signal) => api.getAttendance({ date: today }, { signal }),
    [today]
  );
  const summaryCall = useResource(
    (signal) =>
      api.getAttendanceSummary({ from: weekAgo, to: today }, { signal }),
    [weekAgo, today]
  );
  const staffCall = useResource((signal) => api.listStaff({}, { signal }), []);
  const roomsCall = useResource((signal) => api.listClassrooms({ signal }), []);
  const careCall = useResource(
    (signal) => api.getCareLogs({ date: today }, { signal }),
    [today]
  );
  const docsCall = useResource((signal) => api.listDocuments({ signal }), []);
  const notifyCall = useResource(
    (signal) => api.listNotifications({ per_page: 6 }, { signal }),
    []
  );

  const children = useMemo(() => childrenCall.data || [], [childrenCall.data]);
  const register = registerCall.data || null;
  const records = useMemo(() => register?.records || [], [register]);
  const staff = useMemo(() => staffCall.data || [], [staffCall.data]);
  const rooms = useMemo(() => roomsCall.data || [], [roomsCall.data]);
  const care = careCall.data || null;
  const documents = useMemo(() => docsCall.data || [], [docsCall.data]);
  const notifications = useMemo(
    () => notifyCall.data || [],
    [notifyCall.data]
  );

  const onSite = records.filter(
    (record) => record.check_in_at && !record.check_out_at
  ).length;

  // Unmarked has to come from the roster diff: the register's own `total` is
  // set to the record count, so it can never reveal a missing child.
  const markedIds = useMemo(
    () => new Set(records.map((record) => record.child_id)),
    [records]
  );
  const unmarked = children.filter((child) => !markedIds.has(child.id));

  const attendanceSeries = useMemo(
    () =>
      (summaryCall.data?.days || []).map((day) => ({
        label: new Date(day.date).toLocaleDateString("en-IN", {
          day: "numeric",
        }),
        value: day.present,
        date: new Date(day.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
      })),
    [summaryCall.data]
  );

  const classroomSegments = useMemo(
    () =>
      rooms
        .filter((room) => (room.enrolled_count ?? 0) > 0)
        .map((room, index) => ({
          label: room.name,
          value: room.enrolled_count,
          color: CLASSROOM_PALETTE[index % CLASSROOM_PALETTE.length],
        })),
    [rooms]
  );

  /**
   * Everything that genuinely needs the owner's attention, every item of it
   * derived from a real response. Ordered by how badly it matters, not by
   * which call returned first.
   */
  const attention = useMemo(() => {
    const items = [];

    const unauthorised = records.filter((r) => r.unauthorised_pickup);
    if (unauthorised.length) {
      items.push({
        id: "unauthorised",
        tone: "red",
        icon: "alertTriangle",
        title:
          unauthorised.length === 1
            ? "A child was collected by someone unauthorised"
            : `${unauthorised.length} children were collected by someone unauthorised`,
        body: unauthorised.map((r) => r.child_name).join(", "),
        to: "/dashboard/attendance",
      });
    }

    const noParent = children.filter((child) => (child.guardian_count ?? 0) === 0);
    if (noParent.length) {
      items.push({
        id: "no-parent",
        tone: "amber",
        icon: "userPlus",
        title:
          noParent.length === 1
            ? "One child has no parent linked"
            : `${noParent.length} children have no parent linked`,
        body: "Their families see nothing in the app until an invite is accepted.",
        to: "/dashboard/children",
      });
    }

    const neverSignedIn = staff.filter(
      (person) => person.is_active !== false && !person.has_signed_in
    );
    if (neverSignedIn.length) {
      items.push({
        id: "never-signed-in",
        tone: "amber",
        icon: "users",
        title:
          neverSignedIn.length === 1
            ? "One caretaker has never signed in"
            : `${neverSignedIn.length} caretakers have never signed in`,
        body: "They cannot mark attendance or log care until they do.",
        to: "/dashboard/staff",
      });
    }

    const noRoom = staff.filter(
      (person) =>
        person.is_active !== false && (person.classrooms || []).length === 0
    );
    if (noRoom.length) {
      items.push({
        id: "no-room",
        tone: "blue",
        icon: "grid",
        title:
          noRoom.length === 1
            ? "One caretaker has no room assigned"
            : `${noRoom.length} caretakers have no room assigned`,
        body: "They sign in to an empty roster.",
        to: "/dashboard/staff",
      });
    }

    if (unmarked.length && children.length) {
      items.push({
        id: "unmarked",
        tone: "amber",
        icon: "checkSquare",
        title: `${unmarked.length} of ${children.length} children not marked today`,
        body: "Nobody has recorded them — neither a caretaker nor their parent.",
        to: "/dashboard/attendance",
      });
    }

    const openNaps = (care?.records || []).filter(
      (log) => log.kind === "NAP" && log.data?.start && !log.data?.end
    );
    if (openNaps.length) {
      items.push({
        id: "open-naps",
        tone: "blue",
        icon: "moon",
        title:
          openNaps.length === 1
            ? "A nap was never closed"
            : `${openNaps.length} naps were never closed`,
        body: 'Those families still see "still asleep".',
        to: "/dashboard/daily-care",
      });
    }

    const rejected = documents.filter((doc) => doc.status === "REJECTED");
    if (rejected.length) {
      items.push({
        id: "rejected-docs",
        tone: "red",
        icon: "fileText",
        title:
          rejected.length === 1
            ? "A document was rejected"
            : `${rejected.length} documents were rejected`,
        body: "Read the reviewer's note and re-upload.",
        to: "/dashboard/centre-profile",
      });
    }

    return items;
  }, [records, children, staff, unmarked, care, documents]);

  const loading =
    childrenCall.loading || registerCall.loading || staffCall.loading;

  const careDone = care?.completed_children ?? 0;
  const careEligible = care?.eligible_children ?? 0;

  return (
    <>
      <PageHead
        title={`${greetingFor()}, ${(user?.name || "there").split(" ")[0]}`}
        sub={new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      >
        <Btn
          variant="outline"
          icon="checkSquare"
          onClick={() => navigate("/dashboard/attendance")}
        >
          Today&rsquo;s register
        </Btn>
        <Btn
          icon="userPlus"
          onClick={() => navigate("/dashboard/children?new=1")}
        >
          Add a child
        </Btn>
      </PageHead>

      <div className="stats">
        <StatCard
          icon="baby"
          tone="brand"
          label="Children enrolled"
          value={childrenCall.loading ? "—" : children.length}
        />
        <StatCard
          icon="checkCircle"
          tone="green"
          label="On site now"
          value={registerCall.loading ? "—" : onSite}
        />
        <StatCard
          icon="users"
          tone="blue"
          label="Caretakers"
          value={staffCall.loading ? "—" : staff.length}
        />
        <StatCard
          icon="heart"
          tone={
            careEligible === 0
              ? "grey"
              : careDone === careEligible
                ? "green"
                : "amber"
          }
          label="Day logged"
          value={careCall.loading ? "—" : `${careDone}/${careEligible}`}
        />
      </div>

      <Panel
        title="Needs your attention"
        sub={
          loading
            ? "Checking..."
            : attention.length === 0
              ? "Nothing outstanding"
              : `${attention.length} ${attention.length === 1 ? "thing" : "things"}`
        }
        badge={
          attention.length
            ? { label: String(attention.length), tone: "amber" }
            : undefined
        }
      >
        {loading ? (
          <Empty icon="clock" title="Checking..." body="Reading today's data." />
        ) : attention.length === 0 ? (
          <Empty
            icon="checkCircle"
            title="All clear"
            body="Every child is accounted for, every caretaker can sign in, and every family is linked."
          />
        ) : (
          attention.map((item) => (
            <Link className="attnrow" key={item.id} to={item.to}>
              <span className={`attnrow__icon attnrow__icon--${item.tone}`}>
                <Icon name={item.icon} size={16} />
              </span>
              <span className="attnrow__body">
                <strong>{item.title}</strong>
                <span className="muted">{item.body}</span>
              </span>
              <Icon name="chevronRight" size={16} />
            </Link>
          ))
        )}
      </Panel>

      <div className="grid-2">
        <Panel title="Children present" sub="Last 14 days">
          {summaryCall.loading ? (
            <Empty icon="barChart" title="Loading..." body="Fetching attendance." />
          ) : summaryCall.error ? (
            <Empty
              icon="alertTriangle"
              title="Could not load attendance"
              body={summaryCall.error.message}
            />
          ) : attendanceSeries.every((day) => day.value === 0) ? (
            <Empty
              icon="barChart"
              title="No attendance recorded yet"
              body="This fills in once your caretakers start marking the register."
            />
          ) : (
            <BarChart data={attendanceSeries} color="#16a34a" height={220} />
          )}
        </Panel>

        <Panel title="Enrolment by classroom">
          {roomsCall.loading ? (
            <Empty icon="grid" title="Loading..." body="Fetching your rooms." />
          ) : classroomSegments.length === 0 ? (
            <Empty
              icon="grid"
              title="No children in rooms yet"
              body="Enrol a child into a classroom and this fills in."
              action={
                <Link className="dbtn dbtn--primary" to="/dashboard/children?new=1">
                  Add a child
                </Link>
              }
            />
          ) : (
            <Donut
              segments={classroomSegments}
              centre={{
                label: "Enrolled",
                value: classroomSegments.reduce((sum, s) => sum + s.value, 0),
              }}
            />
          )}
        </Panel>
      </div>

      <Panel
        title="Latest notifications"
        action={
          <Link className="dbtn dbtn--outline" to="/dashboard/settings">
            See all
          </Link>
        }
      >
        {notifyCall.loading ? (
          <Empty icon="bell" title="Loading..." body="Fetching notifications." />
        ) : notifications.length === 0 ? (
          <Empty
            icon="bell"
            title="Nothing yet"
            body="Alerts about pickups and absences appear here."
          />
        ) : (
          notifications.map((item) => (
            <div className="drow" key={item.id}>
              <Who
                name={item.title}
                sub={item.body}
                icon="bell"
                tone="brand"
                size={34}
              />
              <strong className="nowrap muted" style={{ fontSize: 12.5 }}>
                {new Date(item.created_at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "Asia/Kolkata",
                })}
              </strong>
            </div>
          ))
        )}
      </Panel>
    </>
  );
}
