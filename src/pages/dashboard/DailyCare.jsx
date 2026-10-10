import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import {
  Avatar,
  Btn,
  Empty,
  PageHead,
  Panel,
  Search,
  Select,
  StatCard,
  Tag,
} from "../../components/dash/ui.jsx";
import { Drawer } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import * as api from "../../api/endpoints.js";
import { useAction, useResource } from "../../api/useResource.js";

/**
 * The owner's view of the care logs the staff app writes.
 *
 * TWO THINGS THE OLD PAGE GOT STRUCTURALLY WRONG.
 *
 * It modelled one log per child per day — a record holding meals, water,
 * naps, diapers, mood and a note. The API has many rows per child, each one
 * `{ kind, occurred_at, data, note }`, written through the day as things
 * happen. So the page groups a flat list by child rather than expecting the
 * server to have done it.
 *
 * And it had a "Logs shared" panel saying "Parents can only see a log once
 * it's shared". There is no share step and no visibility flag — `care_logs`
 * carries only `deleted_at`. A log reaches the parent the moment a caretaker
 * writes it, provided that family has granted consent. Telling an owner they
 * control when parents see things, when they do not, is the kind of wrong
 * that only surfaces as an angry phone call.
 *
 * Dropped with it: water intake (no kind for it) and the diaper/toilet split
 * (one DIAPER kind with POTTY / CHANGE / ACCIDENT inside `data`).
 *
 * What replaced the fake share metric is the real one the API already
 * computes: how many of the eligible children have anything logged at all.
 */

const KIND_META = {
  MEAL: { label: "Meals", icon: "utensils", tone: "amber" },
  NAP: { label: "Naps", icon: "moon", tone: "brand" },
  DIAPER: { label: "Nappies", icon: "droplet", tone: "pink" },
  HEALTH: { label: "Health", icon: "heart", tone: "red" },
  MOOD: { label: "Mood", icon: "smile", tone: "green" },
  NOTE: { label: "Notes", icon: "message", tone: "blue" },
};

const MEAL_SLOT = { BREAKFAST: "Breakfast", LUNCH: "Lunch", SNACK: "Snack" };
const MEAL_AMOUNT = {
  ALL: "ate it all",
  MOST: "ate most",
  SOME: "ate some",
  NONE: "did not eat",
};
const DIAPER_TYPE = { POTTY: "Potty", CHANGE: "Change", ACCIDENT: "Accident" };

const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

/**
 * A time on the CENTRE's clock, not the reader's.
 *
 * The API sends an offset, so the instant is unambiguous — but formatting
 * without an explicit timeZone renders it wherever the browser happens to be,
 * and an owner checking the dashboard from abroad would see every nap and
 * check-in shifted. Asia/Kolkata is the centre's day, matching
 * core/utils/centre_time.dart in the apps.
 */
const timeLabel = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : "";

/** One line of plain English for a log, read out of its `data` map. */
function describe(log) {
  const data = log.data || {};
  switch (log.kind) {
    case "MEAL": {
      const slot = MEAL_SLOT[data.meal] || "Meal";
      const amount = MEAL_AMOUNT[data.amount] || "recorded";
      return `${slot} — ${amount}${data.menu ? ` (${data.menu})` : ""}`;
    }
    case "NAP": {
      const from = timeLabel(data.start);
      const to = timeLabel(data.end);
      if (!from) return "Nap recorded";
      if (!to) return `Asleep from ${from} — not yet closed`;
      const minutes = Number(data.minutes);
      const length = Number.isFinite(minutes) && minutes > 0
        ? ` (${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ""}${minutes % 60}m)`
        : "";
      return `Slept ${from} – ${to}${length}`;
    }
    case "DIAPER":
      return DIAPER_TYPE[data.type] || "Nappy change";
    case "HEALTH": {
      const temp = data.temperature ?? data.temperature_f;
      const parts = [];
      if (temp !== undefined && temp !== null) parts.push(`${temp}°F`);
      if (data.status) parts.push(data.status);
      const detail = data.note || log.note;
      return `${parts.join(" · ") || "Reading"}${detail ? ` — ${detail}` : ""}`;
    }
    case "MOOD":
      return data.mood ? `Mood: ${data.mood}` : "Mood recorded";
    case "NOTE":
      return data.text || log.note || "Note";
    default:
      return log.kind;
  }
}

export default function DailyCare() {
  const toast = useToast();
  const { user } = useAuth();
  const [date, setDate] = useState(isoDate(new Date()));
  const [query, setQuery] = useState("");
  const [room, setRoom] = useState("");
  const [openChildId, setOpenChildId] = useState(null);

  const careCall = useResource(
    (signal) =>
      api.getCareLogs(
        { date, classroom_id: room || undefined },
        { signal }
      ),
    [date, room]
  );
  const roomsCall = useResource((signal) => api.listClassrooms({ signal }), []);

  const summary = careCall.data || null;
  const logs = useMemo(() => summary?.records || [], [summary]);
  const rooms = useMemo(() => roomsCall.data || [], [roomsCall.data]);

  /** The flat list, grouped into one card per child. */
  const perChild = useMemo(() => {
    const byChild = new Map();
    logs.forEach((log) => {
      if (!byChild.has(log.child_id)) {
        byChild.set(log.child_id, {
          childId: log.child_id,
          name: log.child_name,
          room: log.classroom_name,
          roomId: log.classroom_id,
          logs: [],
        });
      }
      byChild.get(log.child_id).logs.push(log);
    });
    return [...byChild.values()]
      .map((child) => {
        const counts = {};
        child.logs.forEach((log) => {
          counts[log.kind] = (counts[log.kind] || 0) + 1;
        });
        return {
          ...child,
          counts,
          // Newest last, the order a day reads in.
          logs: [...child.logs].sort(
            (a, b) => new Date(a.occurred_at) - new Date(b.occurred_at)
          ),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [logs]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return perChild;
    return perChild.filter((child) =>
      child.name.toLowerCase().includes(needle)
    );
  }, [perChild, query]);

  const open = perChild.find((child) => child.childId === openChildId) || null;

  const eligible = summary?.eligible_children ?? 0;
  const completed = summary?.completed_children ?? 0;
  const percent = Math.round(summary?.completion_percent ?? 0);

  // A nap started and never closed shows the parent "still asleep" all
  // evening, so it is worth an owner's attention at the end of the day.
  const openNaps = logs.filter(
    (log) => log.kind === "NAP" && log.data?.start && !log.data?.end
  );

  return (
    <>
      <PageHead
        title="Daily care"
        sub={
          careCall.loading
            ? "Loading the day..."
            : "What your caretakers logged, as parents see it"
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

      <p className="note-box" style={{ marginBottom: 16 }}>
        <Icon name="helpCircle" size={15} /> Parents see each entry as soon as
        a caretaker writes it — there is no step where you share it. You can
        remove an entry that was logged in error.
      </p>

      {careCall.error ? (
        <Panel>
          <Empty
            icon="alertTriangle"
            title="Could not load the day's care"
            body={careCall.error.message}
            action={
              <Btn variant="outline" onClick={careCall.reload}>
                Try again
              </Btn>
            }
          />
        </Panel>
      ) : (
        <>
          <div className="stats">
            <StatCard
              icon="heart"
              tone="brand"
              label="Children with entries"
              value={summary ? `${completed}/${eligible}` : "—"}
            />
            <StatCard
              icon="checkCircle"
              tone={percent >= 90 ? "green" : percent >= 50 ? "amber" : "red"}
              label="Day logged"
              value={summary ? `${percent}%` : "—"}
            />
            <StatCard
              icon="activity"
              tone="blue"
              label="Entries today"
              value={summary ? logs.length : "—"}
            />
            <StatCard
              icon="moon"
              tone={openNaps.length > 0 ? "amber" : "grey"}
              label="Naps left open"
              value={summary ? openNaps.length : "—"}
            />
          </div>

          {openNaps.length > 0 ? (
            <p className="note-box" style={{ marginBottom: 16 }}>
              <Icon name="alertTriangle" size={15} />{" "}
              {openNaps.length === 1
                ? "One nap was started and never closed"
                : `${openNaps.length} naps were started and never closed`}{" "}
              — those families see &ldquo;still asleep&rdquo; until a caretaker
              marks the child awake.
            </p>
          ) : null}

          <MenuPanel
            date={date}
            daycareId={user?.daycare?.id}
            onSaved={() => toast("Menu saved")}
          />

          <div className="toolbar" style={{ marginTop: 18 }}>
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
          </div>

          <Panel
            title="By child"
            badge={{ label: `${visible.length} shown`, tone: "brand" }}
          >
            {careCall.loading ? (
              <Empty icon="heart" title="Loading..." body="Fetching the day." />
            ) : perChild.length === 0 ? (
              <Empty
                icon="heart"
                title="Nothing logged for this date"
                body={
                  eligible > 0
                    ? `None of your ${eligible} children have an entry yet. Caretakers log meals, naps and nappies from the staff app.`
                    : "No children are enrolled yet."
                }
              />
            ) : visible.length === 0 ? (
              <Empty
                icon="search"
                title="Nobody matches that search"
                body="Try a different name."
              />
            ) : (
              <div className="carecards">
                {visible.map((child) => (
                  <button
                    key={child.childId}
                    type="button"
                    className="carecard"
                    onClick={() => setOpenChildId(child.childId)}
                  >
                    <span className="carecard__head">
                      <Avatar name={child.name} size={34} />
                      <span className="carecard__who">
                        <strong>{child.name}</strong>
                        <span className="muted">{child.room}</span>
                      </span>
                      <Icon name="chevronRight" size={16} />
                    </span>
                    <span className="carecard__kinds">
                      {Object.entries(KIND_META).map(([kind, meta]) =>
                        child.counts[kind] ? (
                          <Tag key={kind} tone={meta.tone}>
                            {meta.label} {child.counts[kind]}
                          </Tag>
                        ) : null
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      {open ? (
        <ChildDayDrawer
          child={open}
          onClose={() => setOpenChildId(null)}
          onDeleted={() => {
            careCall.reload();
            toast("Entry removed");
          }}
        />
      ) : null}
    </>
  );
}

/**
 * The day's menu.
 *
 * Written with `PUT /daycares/me/menus/{date}` and read back through the
 * public `GET /v1/menus`, which is the only read there is and which needs the
 * centre's UUID.
 *
 * `menu` is a free-form JSON object. The keys below match the care-log meal
 * slots lowercased — breakfast / lunch / snack — so that whoever wires the
 * parent app's meals screen has one convention to follow rather than two.
 */
function MenuPanel({ date, daycareId, onSaved }) {
  const [draft, setDraft] = useState(null);

  const call = useResource(
    (signal) => api.getMenus({ date, daycare_id: daycareId }, { signal }),
    [date, daycareId],
    { enabled: Boolean(daycareId) }
  );

  const stored = useMemo(() => {
    const rows = call.data || [];
    return rows[0]?.menu || {};
  }, [call.data]);

  const value = draft ?? {
    breakfast: stored.breakfast || "",
    lunch: stored.lunch || "",
    snack: stored.snack || "",
  };

  const save = useAction(() =>
    api.putDailyMenu(date, {
      menu: {
        breakfast: value.breakfast.trim(),
        lunch: value.lunch.trim(),
        snack: value.snack.trim(),
      },
      client_id: crypto.randomUUID(),
    })
  );

  const dirty = draft !== null;

  if (!daycareId) {
    return (
      <Panel title="Today's menu">
        <p className="muted">
          Your centre details are still loading, so the menu cannot be shown
          yet.
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Menu"
      sub="What is being served, shown to parents alongside each child's log"
      action={
        <Btn
          icon="check"
          disabled={!dirty || save.busy}
          onClick={() =>
            save
              .run()
              .then(() => {
                setDraft(null);
                call.reload();
                onSaved();
              })
              .catch(() => {})
          }
        >
          {save.busy ? "Saving..." : dirty ? "Save menu" : "Saved"}
        </Btn>
      }
    >
      {call.loading ? (
        <p className="muted">Loading the menu...</p>
      ) : (
        <div className="dfield-2">
          {[
            ["breakfast", "Breakfast", "Idli with sambar + banana"],
            ["lunch", "Lunch", "Dal khichdi, curd, cucumber"],
            ["snack", "Evening snack", "Vegetable poha + milk"],
          ].map(([key, label, placeholder]) => (
            <label className="dfield" key={key}>
              <span>{label}</span>
              <input
                value={value[key]}
                placeholder={placeholder}
                onChange={(event) =>
                  setDraft({ ...value, [key]: event.target.value })
                }
              />
            </label>
          ))}
        </div>
      )}
      {save.error ? (
        <p className="dfield__error">{save.error.message}</p>
      ) : null}
    </Panel>
  );
}

/** One child's day, entry by entry, with the owner's delete. */
function ChildDayDrawer({ child, onClose, onDeleted }) {
  return (
    <Drawer
      title={child.name}
      sub={`${child.room} · ${child.logs.length} ${
        child.logs.length === 1 ? "entry" : "entries"
      }`}
      onClose={onClose}
    >
      {Object.entries(KIND_META).map(([kind, meta]) => {
        const rows = child.logs.filter((log) => log.kind === kind);
        if (rows.length === 0) return null;
        return (
          <section className="dsec" key={kind}>
            <h3>
              <Icon name={meta.icon} size={16} /> {meta.label}
            </h3>
            {rows.map((log) => (
              <LogRow
                key={log.id}
                log={log}
                onDeleted={onDeleted}
              />
            ))}
          </section>
        );
      })}
    </Drawer>
  );
}

function LogRow({ log, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const remove = useAction(() => api.deleteCareLog(log.id));

  return (
    <div className="drow">
      <span>
        {describe(log)}
        <br />
        <span className="muted" style={{ fontSize: 12.5 }}>
          {timeLabel(log.occurred_at)}
          {log.note && log.kind !== "NOTE" ? ` · ${log.note}` : ""}
        </span>
      </span>
      <strong>
        {confirming ? (
          <span style={{ display: "flex", gap: 8 }}>
            <Btn
              size="sm"
              variant="outline"
              onClick={() => setConfirming(false)}
            >
              Keep
            </Btn>
            <Btn
              size="sm"
              variant="danger"
              disabled={remove.busy}
              onClick={() =>
                remove
                  .run()
                  .then(onDeleted)
                  .catch(() => setConfirming(false))
              }
            >
              {remove.busy ? "..." : "Remove"}
            </Btn>
          </span>
        ) : (
          // Two taps, because removing an entry takes it off the parent's
          // phone as well.
          <Btn size="sm" variant="outline" onClick={() => setConfirming(true)}>
            Remove
          </Btn>
        )}
      </strong>
    </div>
  );
}
