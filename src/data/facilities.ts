// NYS DOCCS Facility data for Western NY region

export interface Facility {
  id: string;
  name: string;
  type: "maximum" | "medium" | "womens-medium";
  location: string;
  county: string;
  coordinates: { lat: number; lng: number };
  visitingHours: {
    days: string;
    start: string;
    end: string;
    latestArrival: string;
  };
  visitingRules: VisitingRules;
  distanceFromBuffalo: number; // miles
  notes: string[];
}

export type VisitingRules =
  | { type: "open" }
  | { type: "din-odd-even"; description: string }
  | { type: "din-alternating-weekends"; description: string }
  | { type: "last-name-letter"; description: string }
  | { type: "din-alternating-weekends-capped"; maxConcurrent: number; description: string };

export const facilities: Facility[] = [
  {
    id: "wende",
    name: "Wende Correctional Facility",
    type: "maximum",
    location: "Alden, NY",
    county: "Erie",
    coordinates: { lat: 42.9003, lng: -78.4892 },
    visitingHours: {
      days: "Saturday, Sunday",
      start: "09:00",
      end: "15:30",
      latestArrival: "14:15",
    },
    visitingRules: { type: "open" },
    distanceFromBuffalo: 20,
    notes: ["Open visitation on weekends — no DIN restrictions."],
  },
  {
    id: "collins",
    name: "Collins Correctional Facility",
    type: "medium",
    location: "Collins, NY",
    county: "Erie",
    coordinates: { lat: 42.4892, lng: -78.7681 },
    visitingHours: {
      days: "Saturday, Sunday",
      start: "08:30",
      end: "15:00",
      latestArrival: "14:30",
    },
    visitingRules: {
      type: "din-odd-even",
      description:
        "Schedule rotates based on the last digit of the inmate's DIN. Odd DIN last digits visit on one day, even on the other.",
    },
    distanceFromBuffalo: 35,
    notes: [
      "Visiting day determined by last digit of inmate's DIN (odd/even).",
    ],
  },
  {
    id: "wyoming",
    name: "Wyoming Correctional Facility",
    type: "medium",
    location: "Attica, NY",
    county: "Wyoming",
    coordinates: { lat: 42.8645, lng: -78.2803 },
    visitingHours: {
      days: "Saturday, Sunday",
      start: "08:15",
      end: "15:15",
      latestArrival: "14:15",
    },
    visitingRules: {
      type: "din-alternating-weekends",
      description:
        "Alternating weekends based on the last digit of the inmate's DIN.",
    },
    distanceFromBuffalo: 38,
    notes: ["Alternating weekends by DIN last digit."],
  },
  {
    id: "albion",
    name: "Albion Correctional Facility",
    type: "womens-medium",
    location: "Albion, NY",
    county: "Orleans",
    coordinates: { lat: 43.2467, lng: -78.1936 },
    visitingHours: {
      days: "Saturday, Sunday",
      start: "08:00",
      end: "14:30",
      latestArrival: "14:00",
    },
    visitingRules: {
      type: "last-name-letter",
      description:
        "Visiting schedule determined by the first letter of the inmate's last name.",
    },
    distanceFromBuffalo: 45,
    notes: [
      "Women's facility. Schedule based on first letter of inmate's last name.",
    ],
  },
  {
    id: "orleans",
    name: "Orleans Correctional Facility",
    type: "medium",
    location: "Albion, NY",
    county: "Orleans",
    coordinates: { lat: 43.2481, lng: -78.1822 },
    visitingHours: {
      days: "Saturday, Sunday",
      start: "08:00",
      end: "15:15",
      latestArrival: "14:00",
    },
    visitingRules: {
      type: "din-alternating-weekends-capped",
      maxConcurrent: 40,
      description:
        "Alternating weekends by DIN. Visiting room caps at 40 concurrent visits.",
    },
    distanceFromBuffalo: 45,
    notes: [
      "Alternating weekends by DIN.",
      "Visiting room maximum: 40 concurrent visits.",
    ],
  },
];

export function getFacilityById(id: string): Facility | undefined {
  return facilities.find((f) => f.id === id);
}
