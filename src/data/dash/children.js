import { classrooms, dayOffset, fmtDate, pick, rng } from "./seed.js";

const firstNames = [
  "Aarav", "Diya", "Vihaan", "Anaya", "Reyansh", "Myra", "Advik", "Saanvi",
  "Kabir", "Aadhya", "Ishaan", "Kiara", "Arjun", "Pari", "Vivaan", "Riya",
  "Atharv", "Anika", "Rudra", "Navya", "Shaurya", "Ira", "Ayaan", "Meher",
  "Krish", "Aria", "Dhruv", "Tara", "Neil", "Zara", "Aryan", "Mira",
  "Veer", "Amaira", "Rehan", "Nitara",
];

const surnames = [
  "Shah", "Gupta", "Iyer", "Reddy", "Nair", "Bansal", "Kulkarni", "Menon",
  "Patel", "Sharma", "Verma", "Joshi", "Chopra", "Desai", "Kapoor", "Rao",
  "Mehta", "Bose", "Pillai", "Sinha",
];

const parentFirst = {
  mother: ["Priya", "Sneha", "Nisha", "Kavya", "Anjali", "Deepa", "Ritu", "Pooja", "Swati", "Leena"],
  father: ["Rahul", "Amit", "Karan", "Vikram", "Rohit", "Sanjay", "Manish", "Nikhil", "Suresh", "Arun"],
};

const allergyPool = [
  "Peanuts", "Dairy", "Eggs", "Dust", "Pollen", "Shellfish", "Soy", "Gluten",
];

const medicalPool = [
  "None recorded",
  "Mild asthma — inhaler kept in the office",
  "Eczema — cream applied after nap",
  "Wears spectacles",
  "Lactose intolerant",
  "Febrile seizures history — call parents at 100°F",
];

const bloodGroups = ["A+", "B+", "O+", "AB+", "A-", "O-"];
const relations = ["Grandmother", "Grandfather", "Uncle", "Aunt", "Neighbour"];

const docSets = [
  ["Birth certificate", "Immunisation record", "Address proof", "Photo ID"],
];

const random = rng(20260805);

function buildChild(index) {
  const first = firstNames[index % firstNames.length];
  const last = surnames[(index * 7 + 3) % surnames.length];
  const name = `${first} ${last}`;

  // Younger children sit in the earlier classrooms.
  const roomIndex =
    index % 11 === 0 ? 0 : index % 5 === 1 ? 1 : index % 4 === 2 ? 2 : index % 3 === 0 ? 3 : 4;
  const room = classrooms[roomIndex];

  const ageMonths = [8, 20, 32, 44, 62][roomIndex] + (index % 7);
  const dob = dayOffset(-ageMonths * 30 - (index % 25));

  const motherName = `${pick(parentFirst.mother, random)} ${last}`;
  const fatherName = `${pick(parentFirst.father, random)} ${last}`;
  const primary = index % 2 === 0 ? motherName : fatherName;

  const phone = `+91 9${String(80000000 + index * 137 + 4211).slice(0, 8)}`;
  const hasAllergy = index % 4 === 0;

  const statusRoll = index % 17;
  const status = statusRoll === 0 ? "On leave" : statusRoll === 7 ? "Graduating" : "Active";

  return {
    id: `KID-${1000 + index}`,
    name,
    gender: index % 2 === 0 ? "Female" : "Male",
    dob,
    dobLabel: fmtDate(dob),
    ageLabel:
      ageMonths < 24
        ? `${ageMonths} months`
        : `${Math.floor(ageMonths / 12)} yrs ${ageMonths % 12} mo`,
    ageMonths,
    classroom: room.name,
    classroomId: room.id,
    status,
    admittedOn: dayOffset(-((index % 20) * 31 + 45)),
    admittedLabel: fmtDate(dayOffset(-((index % 20) * 31 + 45))),
    guardian: primary,
    guardianRelation: index % 2 === 0 ? "Mother" : "Father",
    mother: motherName,
    father: fatherName,
    phone,
    altPhone: `+91 9${String(70000000 + index * 211 + 9008).slice(0, 8)}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com`,
    address: `${12 + (index % 40)}, ${
      ["Jubilee Hills", "Kondapur", "Banjara Hills", "Madhapur", "Gachibowli"][index % 5]
    }, Hyderabad`,
    bloodGroup: bloodGroups[index % bloodGroups.length],
    allergies: hasAllergy ? [allergyPool[index % allergyPool.length]] : [],
    medical: medicalPool[index % medicalPool.length],
    emergency: [
      {
        name: `${pick(parentFirst.mother, random)} ${last}`,
        relation: relations[index % relations.length],
        phone: `+91 9${String(60000000 + index * 317 + 1122).slice(0, 8)}`,
      },
    ],
    documents: docSets[0].map((doc, docIndex) => ({
      name: doc,
      status: (index + docIndex) % 9 === 0 ? "Missing" : "Verified",
    })),
    feePlan: roomIndex === 0 || roomIndex === 1 ? "Full-day" : index % 3 === 0 ? "Half-day" : "Full-day",
    monthlyFee: roomIndex <= 1 ? 15000 : index % 3 === 0 ? 9500 : 12500,
    attendanceRate: 82 + ((index * 3) % 17),
  };
}

export const children = Array.from({ length: 132 }, (_, index) => buildChild(index));

export const childById = (id) => children.find((child) => child.id === id);

export const activeChildren = children.filter((child) => child.status !== "Graduating");

/** Counts used by the dashboard tiles and the classroom filters. */
export const classroomCounts = classrooms.map((room) => ({
  ...room,
  enrolled: children.filter((child) => child.classroomId === room.id).length,
}));

export const childStatusTone = {
  Active: "green",
  "On leave": "amber",
  Graduating: "blue",
};
