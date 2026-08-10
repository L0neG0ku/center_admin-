import { useMemo, useState } from "react";
import Icon from "../../icons/Icon.jsx";
import { Btn, PageHead, Panel, Tag } from "../../components/dash/ui.jsx";
import { Modal } from "../../components/dash/Overlay.jsx";
import { useToast } from "../../components/dash/Toast.jsx";
import { calendarEvents, eventTypes, upcoming } from "../../data/dash/calendar.js";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const toKey = (date) => date.toISOString().slice(0, 10);

/** Builds a Monday-first grid for the given month, padded with neighbours. */
function buildMonth(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      key: toKey(date),
      inMonth: date.getMonth() === month,
      isToday: toKey(date) === toKey(new Date()),
    };
  });
}

export default function CalendarPage() {
  const toast = useToast();
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [activeDay, setActiveDay] = useState(toKey(today));
  const [adding, setAdding] = useState(false);
  const [hidden, setHidden] = useState([]);

  const cells = useMemo(() => buildMonth(cursor.year, cursor.month), [cursor]);

  const byDay = useMemo(() => {
    const map = {};
    calendarEvents
      .filter((event) => !hidden.includes(event.type))
      .forEach((event) => {
        map[event.dateKey] = map[event.dateKey] || [];
        map[event.dateKey].push(event);
      });
    return map;
  }, [hidden]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const shift = (delta) =>
    setCursor((current) => {
      const date = new Date(current.year, current.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });

  const dayEvents = byDay[activeDay] || [];

  return (
    <>
      <PageHead title="Calendar" sub="Holidays, parent meetings, school events and birthdays">
        <Btn variant="outline" icon="download" onClick={() => toast("Calendar exported as .ics")}>
          Export
        </Btn>
        <Btn icon="plus" onClick={() => setAdding(true)}>
          Add event
        </Btn>
      </PageHead>

      <div className="dcols dcols--main">
        <Panel
          title={monthLabel}
          tools={
            <>
              <button type="button" className="dicon-btn" onClick={() => shift(-1)} aria-label="Previous month">
                <Icon name="chevronLeft" size={17} />
              </button>
              <button
                type="button"
                className="dbtn dbtn--outline dbtn--sm"
                onClick={() => {
                  setCursor({ year: today.getFullYear(), month: today.getMonth() });
                  setActiveDay(toKey(today));
                }}
              >
                Today
              </button>
              <button type="button" className="dicon-btn" onClick={() => shift(1)} aria-label="Next month">
                <Icon name="chevronRight" size={17} />
              </button>
            </>
          }
        >
          <div className="cal">
            {WEEKDAYS.map((day) => (
              <span key={day} className="cal__dow">
                {day}
              </span>
            ))}

            {cells.map((cell) => {
              const events = byDay[cell.key] || [];
              return (
                <button
                  key={cell.key}
                  type="button"
                  className={`cal__cell ${cell.inMonth ? "" : "is-out"} ${
                    cell.isToday ? "is-today" : ""
                  } ${activeDay === cell.key ? "is-active" : ""}`.trim()}
                  onClick={() => setActiveDay(cell.key)}
                >
                  <span className="cal__num">{cell.date.getDate()}</span>
                  <span className="cal__dots">
                    {events.slice(0, 4).map((event) => (
                      <i
                        key={event.id}
                        className={`cal__dot tone-${eventTypes[event.type].tone}`}
                        title={event.title}
                      />
                    ))}
                  </span>
                  {events.length ? (
                    <span className="cal__first">{events[0].title}</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <ul className="cal__legend">
            {Object.entries(eventTypes).map(([type, meta]) => (
              <li key={type}>
                <button
                  type="button"
                  className={hidden.includes(type) ? "is-off" : ""}
                  onClick={() =>
                    setHidden((current) =>
                      current.includes(type)
                        ? current.filter((entry) => entry !== type)
                        : [...current, type]
                    )
                  }
                >
                  <i className={`cal__dot tone-${meta.tone}`} />
                  {type}
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="dstack">
          <Panel
            title={new Date(activeDay).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            badge={{ label: `${dayEvents.length} events`, tone: "brand" }}
          >
            {dayEvents.length ? (
              <ul className="feed">
                {dayEvents.map((event) => {
                  const meta = eventTypes[event.type];
                  return (
                    <li key={event.id}>
                      <div className="feed__row">
                        <span className={`feed__icon tone-${meta.tone}`}>
                          <Icon name={meta.icon} size={15} />
                        </span>
                        <span className="feed__text">
                          <strong>{event.title}</strong>
                          <span>
                            {event.time}
                            {event.note ? ` · ${event.note}` : ""}
                          </span>
                        </span>
                        <Tag tone={meta.tone}>{event.type}</Tag>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted" style={{ padding: "10px 0" }}>
                Nothing scheduled. Add an event to put it in every parent's calendar.
              </p>
            )}
          </Panel>

          <Panel title="Coming up" sub="Next few weeks">
            <ul className="feed feed--tight">
              {upcoming.map((event) => {
                const meta = eventTypes[event.type];
                return (
                  <li key={event.id}>
                    <div className="feed__row">
                      <span className={`feed__icon tone-${meta.tone}`}>
                        <Icon name={meta.icon} size={15} />
                      </span>
                      <span className="feed__text">
                        <strong>{event.title}</strong>
                        <small>
                          {event.date.toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          · {event.time}
                        </small>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>

      {adding ? (
        <Modal
          title="Add an event"
          sub="Events show up in the parent app calendar too."
          onClose={() => setAdding(false)}
          footer={
            <>
              <Btn variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Btn>
              <Btn
                icon="check"
                onClick={() => {
                  setAdding(false);
                  toast("Event added to the calendar");
                }}
              >
                Add event
              </Btn>
            </>
          }
        >
          <label className="dfield">
            <span>Title</span>
            <input placeholder="e.g. Annual day rehearsal" />
          </label>
          <div className="dfield-2">
            <label className="dfield">
              <span>Type</span>
              <select defaultValue="Event">
                {Object.keys(eventTypes)
                  .filter((type) => type !== "Birthday")
                  .map((type) => (
                    <option key={type}>{type}</option>
                  ))}
              </select>
            </label>
            <label className="dfield">
              <span>Date</span>
              <input type="date" defaultValue={activeDay} />
            </label>
            <label className="dfield">
              <span>Starts</span>
              <input type="time" />
            </label>
            <label className="dfield">
              <span>Ends</span>
              <input type="time" />
            </label>
          </div>
          <label className="dfield">
            <span>Note for parents (optional)</span>
            <textarea placeholder="Anything parents need to bring or know" />
          </label>
        </Modal>
      ) : null}
    </>
  );
}
