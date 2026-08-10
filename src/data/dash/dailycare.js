import { children } from "./children.js";

export const moods = [
  { id: "happy", label: "Happy", icon: "smile", tone: "green" },
  { id: "calm", label: "Calm", icon: "sun", tone: "blue" },
  { id: "sleepy", label: "Sleepy", icon: "moon", tone: "grey" },
  { id: "fussy", label: "Fussy", icon: "alertCircle", tone: "amber" },
  { id: "unwell", label: "Unwell", icon: "heart", tone: "red" },
];

export const mealTypes = [
  { id: "breakfast", label: "Breakfast", time: "8:45 AM" },
  { id: "lunch", label: "Lunch", time: "12:30 PM" },
  { id: "snack", label: "Evening snack", time: "4:00 PM" },
];

export const mealAmounts = ["All", "Most", "Some", "None"];

export const todayMenu = {
  breakfast: "Idli with sambar + banana",
  lunch: "Dal khichdi, curd, cucumber",
  snack: "Vegetable poha + milk",
};

const noteSamples = [
  "Settled in quickly and joined circle time.",
  "Needed a little comfort at drop-off, fine after breakfast.",
  "Loved the water play session today.",
  "Slight runny nose — please keep an eye this evening.",
  "Finished the whole plate at lunch for the first time.",
  "Shared toys nicely with the Daisies group.",
];

/**
 * One care log per child for today. In the real product this is written by
 * teachers through the day and pushed straight to the parent app.
 */
export const careLogs = children
  .filter((child) => child.status === "Active")
  .slice(0, 60)
  .map((child, index) => ({
    id: `LOG-${child.id}`,
    childId: child.id,
    name: child.name,
    classroom: child.classroom,
    classroomId: child.classroomId,
    meals: {
      breakfast: mealAmounts[index % 4],
      lunch: mealAmounts[(index + 1) % 4],
      snack: index % 3 === 0 ? "" : mealAmounts[(index + 2) % 4],
    },
    water: 3 + (index % 5),
    naps:
      index % 6 === 0
        ? []
        : [{ from: "1:15 PM", to: index % 3 === 0 ? "2:30 PM" : "3:05 PM" }],
    diapers: child.ageMonths < 30 ? 2 + (index % 3) : 0,
    toilet: child.ageMonths >= 30 ? 3 + (index % 3) : 0,
    mood: moods[index % moods.length].id,
    note: index % 4 === 0 ? noteSamples[index % noteSamples.length] : "",
    sharedWithParent: index % 7 !== 0,
  }));

export const careCompletion = () => {
  const done = careLogs.filter((log) => log.sharedWithParent).length;
  return { done, total: careLogs.length, percent: Math.round((done / careLogs.length) * 100) };
};
