import { classrooms, dayOffset, fmtDate } from "./seed.js";

const requestSeeds = [
  ["Aarohi Kulkarni", "Sneha Kulkarni", 3, "bluebells", "New"],
  ["Vedant Sharma", "Amit Sharma", 2, "daisies", "New"],
  ["Ishita Bose", "Ritu Bose", 1, "sunflowers", "In review"],
  ["Kabir Desai", "Nikhil Desai", 4, "marigolds", "In review"],
  ["Anvi Reddy", "Kavya Reddy", 0, "buttercups", "New"],
  ["Rohan Pillai", "Deepa Pillai", 3, "bluebells", "In review"],
  ["Samaira Jain", "Pooja Jain", 2, "daisies", "Waitlisted"],
  ["Aditya Rao", "Vikram Rao", 5, "marigolds", "Waitlisted"],
  ["Naisha Verma", "Swati Verma", 1, "sunflowers", "Approved"],
  ["Yuvan Menon", "Arun Menon", 4, "marigolds", "Approved"],
  ["Trisha Gupta", "Nisha Gupta", 3, "bluebells", "Approved"],
  ["Aarush Sinha", "Manish Sinha", 2, "daisies", "Rejected"],
];

const sources = ["Kribble parent app", "Walk-in", "Referral", "Phone enquiry"];
const requiredDocs = ["Birth certificate", "Immunisation record", "Address proof", "Parent photo ID"];

export const admissionRequests = requestSeeds.map(([child, parent, years, roomId, status], index) => {
  const room = classrooms.find((entry) => entry.id === roomId);
  const applied = dayOffset(-(index + 1) * 2);

  return {
    id: `ADM-${3100 + index}`,
    childName: child,
    parentName: parent,
    ageYears: years,
    ageLabel: years === 0 ? "10 months" : `${years} yrs`,
    classroom: room.name,
    classroomId: roomId,
    status,
    source: sources[index % sources.length],
    phone: `+91 9${String(91000000 + index * 4177).slice(0, 8)}`,
    email: `${parent.split(" ")[0].toLowerCase()}@gmail.com`,
    appliedOn: applied,
    appliedLabel: fmtDate(applied),
    startsOn: dayOffset(14 + index * 3),
    startsLabel: fmtDate(dayOffset(14 + index * 3)),
    feePlan: index % 3 === 0 ? "Half-day" : "Full-day",
    note:
      index % 4 === 0
        ? "Parent asked about transport from Kondapur."
        : index % 4 === 2
        ? "Wants a centre visit before confirming."
        : "",
    documents: requiredDocs.map((doc, docIndex) => ({
      name: doc,
      status: (index + docIndex) % 5 === 0 ? "Pending" : "Received",
    })),
  };
});

export const admissionStatusTone = {
  New: "brand",
  "In review": "amber",
  Approved: "green",
  Waitlisted: "blue",
  Rejected: "red",
};

export const admissionStages = ["New", "In review", "Approved", "Waitlisted", "Rejected"];

export const seatAvailability = classrooms.map((room, index) => {
  const enrolled = [11, 22, 29, 30, 31][index];
  return {
    ...room,
    enrolled,
    free: room.capacity - enrolled,
  };
});
