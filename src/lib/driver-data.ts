"use client";

/**
 * Mock trip + messaging + GPS data layer.
 *
 * Backed by `localStorage` and a `BroadcastChannel` so the driver portal,
 * rider tracking page, and any open booking tab on the same device can
 * stay in sync during demos. In production, replace every function below
 * with a real API + websocket / SSE / Firebase / Supabase realtime feed.
 */

export type TripStatus =
  | "pending"
  | "accepted"
  | "en_route"
  | "completed"
  | "cancelled";

export interface TripRequest {
  id: string;
  facilityName: string;
  facilityCity: string;
  visitDateIso: string;
  visitDateLabel: string;
  pickupArea: string;
  passengers: number;
  totalDeposit: number;
  riderName: string;
  riderPhone: string;
  notes?: string;
  status: TripStatus;
  acceptedByDriverId?: string;
  acceptedByDriverName?: string;
  /** ISO timestamp of when GPS sharing should automatically open. */
  trackingOpensAtIso: string;
  /** ISO timestamp of trip start. */
  startsAtIso: string;
}

export interface TripMessage {
  id: string;
  tripId: string;
  authorRole: "driver" | "rider";
  authorName: string;
  body: string;
  createdAtIso: string;
}

export interface DriverPing {
  tripId: string;
  driverId: string;
  driverName: string;
  lat: number;
  lng: number;
  /** Heading in degrees clockwise from north, if available. */
  heading?: number;
  /** Speed m/s, if available. */
  speed?: number;
  accuracy?: number;
  capturedAtIso: string;
}

const TRIPS_KEY = "ctnyc.trips.v1";
const MESSAGES_KEY = "ctnyc.messages.v1";
const PING_KEY_PREFIX = "ctnyc.ping.v1.";
const CHANNEL_NAME = "ctnyc-realtime";

let channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

type ChannelEvent =
  | { type: "trips" }
  | { type: "messages"; tripId: string }
  | { type: "ping"; tripId: string };

function emit(event: ChannelEvent): void {
  getChannel()?.postMessage(event);
}

export function subscribe(
  predicate: (event: ChannelEvent) => boolean,
  handler: () => void,
): () => void {
  const ch = getChannel();
  if (!ch) return () => undefined;
  const onMsg = (e: MessageEvent<ChannelEvent>) => {
    if (predicate(e.data)) handler();
  };
  ch.addEventListener("message", onMsg);
  return () => ch.removeEventListener("message", onMsg);
}

// ── Seed data ──────────────────────────────────────────────────────────

function seedTrips(): TripRequest[] {
  const now = Date.now();
  const inHours = (h: number) => new Date(now + h * 3_600_000).toISOString();
  const inDays = (d: number) => new Date(now + d * 86_400_000).toISOString();
  return [
    {
      id: "req-101",
      facilityName: "Wende Correctional Facility",
      facilityCity: "Alden, NY",
      visitDateIso: inDays(2).slice(0, 10),
      visitDateLabel: "Saturday morning",
      pickupArea: "East Buffalo — Jefferson Ave corridor",
      passengers: 4,
      totalDeposit: 200,
      riderName: "Marcus J.",
      riderPhone: "+1 (716) 555-0142",
      notes: "Two riders need wheelchair-accessible seating.",
      status: "pending",
      trackingOpensAtIso: inHours(46),
      startsAtIso: inHours(47),
    },
    {
      id: "req-102",
      facilityName: "Attica Correctional Facility",
      facilityCity: "Attica, NY",
      visitDateIso: inDays(3).slice(0, 10),
      visitDateLabel: "Wednesday weekday visit",
      pickupArea: "Niagara Falls — Highland Ave",
      passengers: 6,
      totalDeposit: 300,
      riderName: "Latoya R.",
      riderPhone: "+1 (716) 555-0188",
      status: "pending",
      trackingOpensAtIso: inHours(70),
      startsAtIso: inHours(71),
    },
    {
      id: "req-103",
      facilityName: "Albion Correctional Facility",
      facilityCity: "Albion, NY",
      visitDateIso: inDays(0.5).slice(0, 10),
      visitDateLabel: "Tomorrow",
      pickupArea: "South Buffalo — Seneca St",
      passengers: 3,
      totalDeposit: 150,
      riderName: "Denise W.",
      riderPhone: "+1 (716) 555-0119",
      status: "pending",
      trackingOpensAtIso: inHours(11),
      startsAtIso: inHours(12),
    },
  ];
}

// ── Trips ──────────────────────────────────────────────────────────────

export function getTrips(): TripRequest[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(TRIPS_KEY);
  if (!raw) {
    const seeded = seedTrips();
    window.localStorage.setItem(TRIPS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as TripRequest[];
  } catch {
    return [];
  }
}

export function saveTrips(trips: TripRequest[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  emit({ type: "trips" });
}

export function updateTrip(
  id: string,
  patch: Partial<TripRequest>,
): TripRequest | null {
  const trips = getTrips();
  const idx = trips.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  trips[idx] = { ...trips[idx], ...patch };
  saveTrips(trips);
  return trips[idx];
}

export function acceptTrip(
  id: string,
  driverId: string,
  driverName: string,
): TripRequest | null {
  return updateTrip(id, {
    status: "accepted",
    acceptedByDriverId: driverId,
    acceptedByDriverName: driverName,
  });
}

export function declineTrip(id: string): void {
  // In production this releases the trip back into the dispatch pool with a
  // decline reason. For the prototype we just mark it cancelled locally.
  updateTrip(id, { status: "cancelled" });
}

// ── Messages ───────────────────────────────────────────────────────────

export function getMessages(tripId: string): TripMessage[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(MESSAGES_KEY);
  const all: TripMessage[] = raw ? (JSON.parse(raw) as TripMessage[]) : [];
  return all.filter((m) => m.tripId === tripId);
}

export function postMessage(message: Omit<TripMessage, "id" | "createdAtIso">): TripMessage {
  if (typeof window === "undefined") {
    return { ...message, id: "ssr", createdAtIso: new Date().toISOString() };
  }
  const raw = window.localStorage.getItem(MESSAGES_KEY);
  const all: TripMessage[] = raw ? (JSON.parse(raw) as TripMessage[]) : [];
  const created: TripMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAtIso: new Date().toISOString(),
  };
  all.push(created);
  window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  emit({ type: "messages", tripId: message.tripId });
  return created;
}

// ── GPS pings ──────────────────────────────────────────────────────────

export function publishPing(ping: DriverPing): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${PING_KEY_PREFIX}${ping.tripId}`,
    JSON.stringify(ping),
  );
  emit({ type: "ping", tripId: ping.tripId });
}

export function readPing(tripId: string): DriverPing | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${PING_KEY_PREFIX}${tripId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DriverPing;
  } catch {
    return null;
  }
}
