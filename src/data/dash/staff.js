import { classrooms, dayOffset, fmtDate } from "./seed.js";

const people = [
  ["Meera Nair", "Lead Teacher", "buttercups"],
  ["Anita Rao", "Lead Teacher", "sunflowers"],
  ["Fatima Sheikh", "Lead Teacher", "daisies"],
  ["Divya Menon", "Lead Teacher", "bluebells"],
  ["Ritu Bansal", "Lead Teacher", "marigolds"],
  ["Sunita Yadav", "Assistant Teacher", "sunflowers"],
  ["Kavita Joshi", "Assistant Teacher", "daisies"],
  ["Rekha Pillai", "Assistant Teacher", "bluebells"],
  ["Shalini Das", "Assistant Teacher", "marigolds"],
  ["Nandini Iyer", "Caregiver", "buttercups"],
  ["Pooja Verma", "Caregiver", "sunflowers"],
  ["Lakshmi Reddy", "Cook", null],
  ["Ramesh Kumar", "Helper", null],
  ["Savitha Rao", "Nurse", null],
  ["Arun Prakash", "Security", null],
  ["Deepa Menon", "Centre Manager", null],
  ["Farhan Ali", "Driver", null],
  ["Geeta Sharma", "Housekeeping", null],
];

const shifts = ["8:00 AM – 4:00 PM", "9:00 AM – 6:00 PM", "7:30 AM – 3:30 PM", "10:00 AM – 7:00 PM"];

export const staff = people.map(([name, role, roomId], index) => {
  const room = classrooms.find((entry) => entry.id === roomId);
  const todayStatus = index === 6 ? "On leave" : index === 12 ? "Absent" : "Present";

  return {
    id: `STF-${200 + index}`,
    name,
    role,
    classroom: room ? room.name : "—",
    classroomId: roomId,
    phone: `+91 9${String(88000000 + index * 3571).slice(0, 8)}`,
    email: `${name.split(" ")[0].toLowerCase()}@littlestars.in`,
    joinedOn: dayOffset(-(200 + index * 47)),
    joinedLabel: fmtDate(dayOffset(-(200 + index * 47))),
    shift: shifts[index % shifts.length],
    status: index === 17 ? "Inactive" : "Active",
    todayStatus,
    checkIn: todayStatus === "Present" ? ["7:52 AM", "8:04 AM", "8:11 AM", "7:58 AM"][index % 4] : "—",
    attendanceRate: 88 + ((index * 5) % 11),
    qualification: [
      "B.Ed, Early Childhood",
      "Montessori Diploma",
      "NTT Certified",
      "B.A. + Childcare Certificate",
      "Diploma in Nursing",
    ][index % 5],
    verified: index % 6 !== 4,
    address: `${20 + index}, ${["Madhapur", "Kondapur", "Miyapur", "Kukatpally"][index % 4]}, Hyderabad`,
  };
});

export const staffById = (id) => staff.find((person) => person.id === id);

export const roles = [...new Set(staff.map((person) => person.role))];

export const staffOnDuty = staff.filter(
  (person) => person.status === "Active" && person.todayStatus === "Present"
).length;
