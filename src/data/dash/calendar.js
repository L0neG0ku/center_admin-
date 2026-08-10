import { children } from "./children.js";
import { dayOffset, today } from "./seed.js";

export const eventTypes = {
  Holiday: { tone: "blue", icon: "sun" },
  Meeting: { tone: "brand", icon: "users" },
  Event: { tone: "pink", icon: "star" },
  Birthday: { tone: "amber", icon: "cake" },
};

const toKey = (date) => date.toISOString().slice(0, 10);

const scheduled = [
  { title: "Independence Day — centre closed", type: "Holiday", offset: 10, time: "All day" },
  { title: "Parent–teacher meeting (Bluebells)", type: "Meeting", offset: 18, time: "10:00 AM – 1:00 PM" },
  { title: "Annual health check-up camp", type: "Event", offset: 5, time: "9:30 AM – 12:30 PM" },
  { title: "Monsoon fun day", type: "Event", offset: 2, time: "10:00 AM" },
  { title: "Fire drill", type: "Event", offset: 1, time: "11:00 AM" },
  { title: "Staff training — first aid refresher", type: "Meeting", offset: 7, time: "3:00 PM – 5:00 PM" },
  { title: "Raksha Bandhan — half day", type: "Holiday", offset: 22, time: "Closes 1:00 PM" },
  { title: "Grandparents' morning", type: "Event", offset: 26, time: "9:00 AM – 11:00 AM" },
  { title: "Term fee reminder goes out", type: "Meeting", offset: -2, time: "9:00 AM" },
];

/** Birthdays are pulled from the roster rather than maintained separately. */
const birthdays = children
  .map((child) => {
    const next = new Date(child.dob);
    next.setFullYear(today.getFullYear());
    if (next < dayOffset(-1)) next.setFullYear(today.getFullYear() + 1);
    return {
      id: `BDAY-${child.id}`,
      title: `${child.name}'s birthday`,
      type: "Birthday",
      date: next,
      dateKey: toKey(next),
      time: "All day",
      note: `${child.classroom} · turning ${Math.floor(child.ageMonths / 12) + 1}`,
    };
  })
  .filter((entry) => {
    const days = (entry.date - today) / 86400000;
    return days > -2 && days < 60;
  });

export const calendarEvents = [
  ...scheduled.map((entry, index) => {
    const date = dayOffset(entry.offset);
    return {
      id: `EVT-${600 + index}`,
      title: entry.title,
      type: entry.type,
      date,
      dateKey: toKey(date),
      time: entry.time,
      note: "",
    };
  }),
  ...birthdays,
].sort((a, b) => a.date - b.date);

export const upcoming = calendarEvents
  .filter((event) => (event.date - today) / 86400000 > -1)
  .slice(0, 6);

export const eventsOn = (dateKey) => calendarEvents.filter((event) => event.dateKey === dateKey);
