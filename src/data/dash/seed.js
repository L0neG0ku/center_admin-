/**
 * Deterministic helpers so the dummy data looks random but never changes
 * between renders (a plain Math.random() would reshuffle on every keystroke).
 */
export function rng(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export const pick = (list, random) => list[Math.floor(random() * list.length)];

export const today = new Date();

/** Days from today, positive = future. */
export function dayOffset(days) {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date;
}

export const fmtDate = (date) =>
  date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const fmtShort = (date) =>
  date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const fmtMoney = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

export const classrooms = [
  { id: "buttercups", name: "Buttercups", ageGroup: "Infants (0–1 yr)", teacher: "Meera Nair", capacity: 12 },
  { id: "sunflowers", name: "Sunflowers", ageGroup: "Toddlers (1–2 yrs)", teacher: "Anita Rao", capacity: 24 },
  { id: "daisies", name: "Daisies", ageGroup: "Early years (2–3 yrs)", teacher: "Fatima Sheikh", capacity: 30 },
  { id: "bluebells", name: "Bluebells", ageGroup: "Nursery (3–4 yrs)", teacher: "Divya Menon", capacity: 32 },
  { id: "marigolds", name: "Marigolds", ageGroup: "LKG & UKG (4–6 yrs)", teacher: "Ritu Bansal", capacity: 34 },
];

export const classroomNames = classrooms.map((room) => room.name);
