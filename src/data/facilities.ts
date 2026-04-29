// NYS DOCCS Facility data — Western NY + Finger Lakes / Central NY
// All facilities reachable within ~2.5 hours of Buffalo, NY.

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sun … 6 = Sat

export interface Facility {
  id: string;
  name: string;
  type: "maximum" | "medium" | "womens-medium";
  location: string;
  county: string;
  coordinates: { lat: number; lng: number };
  /** Days of week the facility accepts visitors. */
  visitingDays: DayOfWeek[];
  visitingHours: {
    /** Human-readable label, e.g. "Wednesdays and Weekends". */
    days: string;
    start: string;
    end: string;
    latestArrival: string;
    /** Optional alt hours used when a weekday and weekend differ. */
    weekdayHours?: { start: string; end: string; latestArrival: string };
  };
  visitingRules: VisitingRules;
  /** Approximate driving distance from Buffalo, NY (miles). */
  distanceFromBuffalo: number;
  /** Approximate one-way driving time from Buffalo (minutes). */
  driveTimeFromBuffalo: number;
  /** True if the facility offers any weekday visiting days. */
  offersWeekdayVisits: boolean;
  notes: string[];
}

export type VisitingRules =
  | { type: "open" }
  | { type: "din-odd-even"; description: string }
  | { type: "din-alternating-weekends"; description: string }
  | { type: "last-name-letter"; description: string }
  | { type: "din-alternating-weekends-capped"; maxConcurrent: number; description: string };

export const facilities: Facility[] = [
  // ── Western NY (under 1 hour) ──────────────────────────────────────────
  {
    id: "wende",
    name: "Wende Correctional Facility",
    type: "maximum",
    location: "Alden, NY",
    county: "Erie",
    coordinates: { lat: 42.9003, lng: -78.4892 },
    visitingDays: [3, 6, 0], // Wed, Sat, Sun
    visitingHours: {
      days: "Wednesdays and Weekends",
      start: "09:00",
      end: "15:30",
      latestArrival: "14:15",
    },
    visitingRules: { type: "open" },
    distanceFromBuffalo: 20,
    driveTimeFromBuffalo: 30,
    offersWeekdayVisits: true,
    notes: ["Open visitation — no DIN restrictions."],
  },
  {
    id: "collins",
    name: "Collins Correctional Facility",
    type: "medium",
    location: "Collins, NY",
    county: "Erie",
    coordinates: { lat: 42.4892, lng: -78.7681 },
    visitingDays: [6, 0],
    visitingHours: {
      days: "Saturday, Sunday",
      start: "08:30",
      end: "15:00",
      latestArrival: "14:30",
    },
    visitingRules: {
      type: "din-odd-even",
      description:
        "Schedule alternates by last digit of inmate's DIN. Even → Saturday, odd → Sunday.",
    },
    distanceFromBuffalo: 35,
    driveTimeFromBuffalo: 50,
    offersWeekdayVisits: false,
    notes: ["Visiting day determined by last digit of DIN (odd/even)."],
  },
  {
    id: "wyoming",
    name: "Wyoming Correctional Facility",
    type: "medium",
    location: "Attica, NY",
    county: "Wyoming",
    coordinates: { lat: 42.8645, lng: -78.2803 },
    visitingDays: [6, 0],
    visitingHours: {
      days: "Saturday, Sunday",
      start: "08:15",
      end: "15:15",
      latestArrival: "14:15",
    },
    visitingRules: {
      type: "din-alternating-weekends",
      description: "Alternating weekends based on the last digit of the DIN.",
    },
    distanceFromBuffalo: 38,
    driveTimeFromBuffalo: 55,
    offersWeekdayVisits: false,
    notes: ["Alternating weekends by DIN last digit."],
  },
  {
    id: "albion",
    name: "Albion Correctional Facility",
    type: "womens-medium",
    location: "Albion, NY",
    county: "Orleans",
    coordinates: { lat: 43.2467, lng: -78.1936 },
    visitingDays: [6, 0],
    visitingHours: {
      days: "Saturday, Sunday",
      start: "08:00",
      end: "14:30",
      latestArrival: "14:00",
    },
    visitingRules: {
      type: "last-name-letter",
      description: "Schedule based on first letter of inmate's last name (A-M / N-Z).",
    },
    distanceFromBuffalo: 45,
    driveTimeFromBuffalo: 55,
    offersWeekdayVisits: false,
    notes: ["Women's facility. Schedule by first letter of last name."],
  },
  {
    id: "orleans",
    name: "Orleans Correctional Facility",
    type: "medium",
    location: "Albion, NY",
    county: "Orleans",
    coordinates: { lat: 43.2481, lng: -78.1822 },
    visitingDays: [6, 0],
    visitingHours: {
      days: "Saturday, Sunday",
      start: "08:00",
      end: "15:15",
      latestArrival: "14:00",
    },
    visitingRules: {
      type: "din-alternating-weekends-capped",
      maxConcurrent: 40,
      description: "Alternating weekends by DIN. Visiting room caps at 40 concurrent visits.",
    },
    distanceFromBuffalo: 45,
    driveTimeFromBuffalo: 55,
    offersWeekdayVisits: false,
    notes: [
      "Alternating weekends by DIN.",
      "Visiting room maximum: 40 concurrent visits.",
    ],
  },

  // ── Finger Lakes & Central NY (1 – 2.5 hours) ─────────────────────────
  {
    id: "attica",
    name: "Attica Correctional Facility",
    type: "maximum",
    location: "Attica, NY",
    county: "Wyoming",
    coordinates: { lat: 42.8542, lng: -78.2814 },
    visitingDays: [3, 6, 0],
    visitingHours: {
      days: "Wednesdays and Weekends",
      start: "08:45",
      end: "15:00",
      latestArrival: "14:00",
    },
    visitingRules: { type: "open" },
    distanceFromBuffalo: 40,
    driveTimeFromBuffalo: 60,
    offersWeekdayVisits: true,
    notes: [
      "Open visitation on scheduled days.",
      "Inmates limited to a maximum of two split visits per day.",
    ],
  },
  {
    id: "groveland",
    name: "Groveland Correctional Facility",
    type: "medium",
    location: "Sonyea, NY",
    county: "Livingston",
    coordinates: { lat: 42.6611, lng: -77.8286 },
    visitingDays: [6, 0],
    visitingHours: {
      days: "Saturday, Sunday",
      start: "08:00",
      end: "15:00",
      latestArrival: "14:15",
    },
    visitingRules: {
      type: "din-odd-even",
      description: "Schedule alternates by last digit of DIN (odd/even).",
    },
    distanceFromBuffalo: 60,
    driveTimeFromBuffalo: 80,
    offersWeekdayVisits: false,
    notes: [
      "Schedule by DIN last digit (odd/even).",
      "Inmates limited to two (2) visits per month.",
    ],
  },
  {
    id: "auburn",
    name: "Auburn Correctional Facility",
    type: "maximum",
    location: "Auburn, NY",
    county: "Cayuga",
    coordinates: { lat: 42.9317, lng: -76.5661 },
    visitingDays: [3, 6, 0],
    visitingHours: {
      days: "Wednesdays and Weekends",
      start: "09:00",
      end: "15:10",
      latestArrival: "14:00",
      weekdayHours: { start: "08:30", end: "14:30", latestArrival: "13:15" },
    },
    visitingRules: { type: "open" },
    distanceFromBuffalo: 140,
    driveTimeFromBuffalo: 150,
    offersWeekdayVisits: true,
    notes: [
      "Open visitation on scheduled days.",
      "Hospitality center across the street for early arrivals or families waiting for return rides.",
    ],
  },
  {
    id: "five-points",
    name: "Five Points Correctional Facility",
    type: "maximum",
    location: "Romulus, NY",
    county: "Seneca",
    coordinates: { lat: 42.7325, lng: -76.8539 },
    visitingDays: [3, 6, 0],
    visitingHours: {
      days: "Wednesdays and Weekends",
      start: "09:00",
      end: "15:00",
      latestArrival: "14:00",
    },
    visitingRules: { type: "open" },
    distanceFromBuffalo: 130,
    driveTimeFromBuffalo: 140,
    offersWeekdayVisits: true,
    notes: [
      "Open visitation on scheduled days.",
      "Visitors guaranteed minimum 3 hours unless arriving after 12:00 PM.",
    ],
  },
  {
    id: "cayuga",
    name: "Cayuga Correctional Facility",
    type: "medium",
    location: "Moravia, NY",
    county: "Cayuga",
    coordinates: { lat: 42.7081, lng: -76.4222 },
    visitingDays: [6, 0],
    visitingHours: {
      days: "Saturday, Sunday",
      start: "08:30",
      end: "15:30",
      latestArrival: "14:30",
    },
    visitingRules: {
      type: "din-odd-even",
      description: "Schedule alternates by last digit of DIN (odd/even).",
    },
    distanceFromBuffalo: 150,
    driveTimeFromBuffalo: 160,
    offersWeekdayVisits: false,
    notes: ["Schedule by DIN last digit (odd/even)."],
  },
  {
    id: "elmira",
    name: "Elmira Correctional Facility",
    type: "maximum",
    location: "Elmira, NY",
    county: "Chemung",
    coordinates: { lat: 42.0939, lng: -76.8019 },
    visitingDays: [4, 6, 0], // Thursday + weekend
    visitingHours: {
      days: "Thursdays and Weekends",
      start: "09:00",
      end: "15:00",
      latestArrival: "14:00",
    },
    visitingRules: { type: "open" },
    distanceFromBuffalo: 150,
    driveTimeFromBuffalo: 165,
    offersWeekdayVisits: true,
    notes: ["Open visitation on scheduled days."],
  },
];

export function getFacilityById(id: string): Facility | undefined {
  return facilities.find((f) => f.id === id);
}

/** Subset of facilities that offer at least one weekday visiting day. */
export const weekdayFacilities = facilities.filter((f) => f.offersWeekdayVisits);
