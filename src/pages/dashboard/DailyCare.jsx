import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import { Avatar, Btn, PageHead, Panel, Search, Select, Tag } from "../../components/dash/ui.jsx";
import { Drawer } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import {
  careLogs,
  mealAmounts,
  mealTypes,
  moods,
  todayMenu,
} from "../../data/dash/dailycare.js";
import { classroomNames } from "../../data/dash/seed.js";
import { todayLabel } from "../../data/dash/overview.js";

const moodById = Object.fromEntries(moods.map((mood) => [mood.id, mood]));

export default function DailyCare() {
  const toast = useToast();
  const [logs, setLogs] = useState(careLogs);
  const [query, setQuery] = useState("");
  const [room, setRoom] = useState("");
  const [openId, setOpenId] = useState(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (room && log.classroom !== room) return false;
      return !needle || log.name.toLowerCase().includes(needle);
    });
  }, [logs, query, room]);

  const shared = logs.filter((log) => log.sharedWithParent).length;
  const percent = Math.round((shared / logs.length) * 100);
  const open = logs.find((log) => log.id === openId);

  const update = (id, patch) =>
    setLogs((current) =>
      current.map((log) => (log.id === id ? { ...log, ...patch } : log))
    );

  const updateMeal = (id, meal, value) =>
    setLogs((current) =>
      current.map((log) =>
        log.id === id ? { ...log, meals: { ...log.meals, [meal]: value } } : log
      )
    );

  return (
    <>
      <PageHead title="Daily Care" sub={`${todayLabel} · updates sync straight to the parent app`}>
        <Btn variant="outline" icon="utensils" onClick={() => toast("Menu editor opens with the backend")}>
          Edit today's menu
        </Btn>
        <Btn
          icon="send"
          onClick={() => {
            setLogs((current) => current.map((log) => ({ ...log, sharedWithParent: true })));
            toast("All care logs shared with parents");
          }}
        >
          Share all
        </Btn>
      </PageHead>

      <div className="dcols dcols--main" style={{ marginBottom: 18 }}>
        <Panel title="Today's menu" sub="Shown to parents alongside each child's log">
          <ul className="menu-row">
            {mealTypes.map((meal) => (
              <li key={meal.id}>
                <span className="menu-row__icon tone-green">
                  <Icon name="utensils" size={18} />
                </span>
                <div>
                  <strong>{meal.label}</strong>
                  <span className="muted">{meal.time}</span>
                  <p>{todayMenu[meal.id]}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Logs shared" sub="Parents can only see a log once it's shared">
          <div className="ring-stat">
            <strong>{percent}%</strong>
            <span>
              {shared} of {logs.length} children
            </span>
          </div>
          <div className="dbar" style={{ marginTop: 6 }}>
            <span style={{ width: `${percent}%` }} />
          </div>
          <ul className="statlist" style={{ marginTop: 18 }}>
            <li>
              <span>Naps recorded</span>
              <strong>{logs.filter((log) => log.naps.length > 0).length}</strong>
            </li>
            <li>
              <span>Notes written</span>
              <strong>{logs.filter((log) => log.note).length}</strong>
            </li>
            <li>
              <span>Meals refused</span>
              <strong>{logs.filter((log) => Object.values(log.meals).includes("None")).length}</strong>
            </li>
          </ul>
        </Panel>
      </div>

      <div className="toolbar">
        <Search value={query} onChange={setQuery} placeholder="Find a child..." />
        <Select value={room} onChange={setRoom} options={classroomNames} placeholder="All classrooms" />
        <div className="toolbar__spacer" />
        <span className="muted" style={{ fontSize: 13 }}>
          {rows.length} children
        </span>
      </div>

      <ul className="carelist">
        {rows.map((log) => {
          const mood = moodById[log.mood];
          return (
            <li key={log.id}>
              <button type="button" className="carecard" onClick={() => setOpenId(log.id)}>
                <header>
                  <Avatar name={log.name} size={40} />
                  <div>
                    <strong>{log.name}</strong>
                    <span>{log.classroom}</span>
                  </div>
                  <Tag tone={mood.tone}>{mood.label}</Tag>
                </header>

                <dl className="carecard__stats">
                  <div>
                    <dt>
                      <Icon name="utensils" size={14} /> Meals
                    </dt>
                    <dd>
                      {Object.values(log.meals).filter(Boolean).length}/3 logged
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="droplet" size={14} /> Water
                    </dt>
                    <dd>{log.water} glasses</dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="moon" size={14} /> Nap
                    </dt>
                    <dd>{log.naps.length ? `${log.naps[0].from} – ${log.naps[0].to}` : "No nap"}</dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="heart" size={14} /> {log.diapers ? "Nappies" : "Toilet"}
                    </dt>
                    <dd>{log.diapers || log.toilet} times</dd>
                  </div>
                </dl>

                <footer>
                  {log.sharedWithParent ? (
                    <Tag tone="green" dot>
                      Shared with parent
                    </Tag>
                  ) : (
                    <Tag tone="amber" dot>
                      Draft
                    </Tag>
                  )}
                  <span className="muted">Open log</span>
                </footer>
              </button>
            </li>
          );
        })}
      </ul>

      {open ? (
        <Drawer
          title={open.name}
          sub={`${open.classroom} · today's care log`}
          onClose={() => setOpenId(null)}
          wide
          footer={
            <>
              <Btn variant="outline" onClick={() => setOpenId(null)}>
                Close
              </Btn>
              <Btn
                icon="send"
                onClick={() => {
                  update(open.id, { sharedWithParent: true });
                  setOpenId(null);
                  toast(`Log shared with ${open.name}'s parents`);
                }}
              >
                {open.sharedWithParent ? "Re-share with parent" : "Share with parent"}
              </Btn>
            </>
          }
        >
          <section className="dsec">
            <h3>
              <Icon name="utensils" size={16} /> Meals
            </h3>
            {mealTypes.map((meal) => (
              <div key={meal.id} className="care-line">
                <div className="care-line__label">
                  <strong>{meal.label}</strong>
                  <span className="muted">{todayMenu[meal.id]}</span>
                </div>
                <div className="segrow">
                  {mealAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`seg ${open.meals[meal.id] === amount ? "is-on seg--green" : ""}`.trim()}
                      onClick={() => updateMeal(open.id, meal.id, amount)}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="dsec">
            <h3>
              <Icon name="droplet" size={16} /> Water intake
            </h3>
            <div className="counter">
              <button type="button" onClick={() => update(open.id, { water: Math.max(0, open.water - 1) })}>
                <Icon name="minusCircle" size={18} />
              </button>
              <strong>{open.water}</strong>
              <span className="muted">glasses</span>
              <button type="button" onClick={() => update(open.id, { water: open.water + 1 })}>
                <Icon name="plus" size={18} />
              </button>
            </div>
          </section>

          <section className="dsec">
            <h3>
              <Icon name="moon" size={16} /> Nap
            </h3>
            {open.naps.length ? (
              open.naps.map((nap, index) => (
                <div key={index} className="care-line">
                  <div className="care-line__label">
                    <strong>
                      {nap.from} – {nap.to}
                    </strong>
                    <span className="muted">Slept in the nap room</span>
                  </div>
                  <Btn size="sm" variant="outline" onClick={() => update(open.id, { naps: [] })}>
                    Remove
                  </Btn>
                </div>
              ))
            ) : (
              <div className="care-line">
                <div className="care-line__label">
                  <strong>No nap recorded</strong>
                  <span className="muted">Add one if the child slept today</span>
                </div>
                <Btn
                  size="sm"
                  variant="soft"
                  icon="plus"
                  onClick={() => update(open.id, { naps: [{ from: "1:15 PM", to: "2:45 PM" }] })}
                >
                  Add nap
                </Btn>
              </div>
            )}
          </section>

          <section className="dsec">
            <h3>
              <Icon name="heart" size={16} /> {open.diapers ? "Nappy changes" : "Toilet visits"}
            </h3>
            <div className="counter">
              <button
                type="button"
                onClick={() =>
                  open.diapers
                    ? update(open.id, { diapers: Math.max(0, open.diapers - 1) })
                    : update(open.id, { toilet: Math.max(0, open.toilet - 1) })
                }
              >
                <Icon name="minusCircle" size={18} />
              </button>
              <strong>{open.diapers || open.toilet}</strong>
              <span className="muted">times today</span>
              <button
                type="button"
                onClick={() =>
                  open.diapers
                    ? update(open.id, { diapers: open.diapers + 1 })
                    : update(open.id, { toilet: open.toilet + 1 })
                }
              >
                <Icon name="plus" size={18} />
              </button>
            </div>
          </section>

          <section className="dsec">
            <h3>
              <Icon name="smile" size={16} /> Mood
            </h3>
            <div className="moodrow">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  type="button"
                  className={`moodbtn ${open.mood === mood.id ? `is-on tone-${mood.tone}` : ""}`.trim()}
                  onClick={() => update(open.id, { mood: mood.id })}
                >
                  <Icon name={mood.icon} size={20} />
                  {mood.label}
                </button>
              ))}
            </div>
          </section>

          <section className="dsec">
            <h3>
              <Icon name="pencil" size={16} /> Note for parents
            </h3>
            <label className="dfield">
              <textarea
                value={open.note}
                placeholder="How was the day? Anything the parents should know this evening?"
                onChange={(event) => update(open.id, { note: event.target.value })}
              />
            </label>
          </section>
        </Drawer>
      ) : null}
    </>
  );
}
