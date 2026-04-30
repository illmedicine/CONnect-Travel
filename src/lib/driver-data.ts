"use client";

/**
 * Production data layer backed by Firestore (trips + messages) and the
 * Firebase Realtime Database (live GPS pings).
 *
 *   /trips/{tripId}                 — trip request + status
 *   /trips/{tripId}/messages/{id}   — chat thread
 *   /pings/{tripId}                 — RTDB node, latest driver location
 *
 * Security rules live in `firestore.rules` and `database.rules.json`.
 */

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  off,
  onValue,
  ref as rtdbRef,
  serverTimestamp as rtdbServerTimestamp,
  set as rtdbSet,
} from "firebase/database";
import { getFirestoreDb, getRealtimeDb } from "@/lib/firebase";

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
  riderUid?: string;
  notes?: string;
  status: TripStatus;
  acceptedByDriverId?: string;
  acceptedByDriverName?: string;
  trackingOpensAtIso: string;
  startsAtIso: string;
}

export interface TripMessage {
  id: string;
  tripId: string;
  authorRole: "driver" | "rider";
  authorUid?: string;
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
  heading?: number;
  speed?: number;
  accuracy?: number;
  capturedAtIso: string;
}

// ── Trips ──────────────────────────────────────────────────────────────

function tripFromDoc(snap: QueryDocumentSnapshot<DocumentData>): TripRequest {
  const d = snap.data();
  return {
    id: snap.id,
    facilityName: d.facilityName ?? "",
    facilityCity: d.facilityCity ?? "",
    visitDateIso: d.visitDateIso ?? "",
    visitDateLabel: d.visitDateLabel ?? "",
    pickupArea: d.pickupArea ?? "",
    passengers: d.passengers ?? 0,
    totalDeposit: d.totalDeposit ?? 0,
    riderName: d.riderName ?? "",
    riderPhone: d.riderPhone ?? "",
    riderUid: d.riderUid,
    notes: d.notes,
    status: (d.status as TripStatus) ?? "pending",
    acceptedByDriverId: d.acceptedByDriverId,
    acceptedByDriverName: d.acceptedByDriverName,
    trackingOpensAtIso: d.trackingOpensAtIso ?? "",
    startsAtIso: d.startsAtIso ?? "",
  };
}

/**
 * Live subscription to the trips a driver should see:
 * everything pending plus their own accepted/active/completed trips.
 */
export function subscribeDriverTrips(
  driverUid: string,
  cb: (trips: TripRequest[]) => void,
): () => void {
  const db = getFirestoreDb();
  const col = collection(db, "trips");

  // Two queries: pending OR mine. We merge client-side because Firestore
  // only supports one inequality + one equality cleanly.
  const qPending = query(col, where("status", "==", "pending"));
  const qMine = query(col, where("acceptedByDriverId", "==", driverUid));

  let pending: TripRequest[] = [];
  let mine: TripRequest[] = [];

  const emit = () => {
    const seen = new Set<string>();
    const merged: TripRequest[] = [];
    for (const t of [...pending, ...mine]) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      merged.push(t);
    }
    merged.sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso));
    cb(merged);
  };

  const unsubA = onSnapshot(qPending, (snap) => {
    pending = snap.docs.map(tripFromDoc);
    emit();
  });
  const unsubB = onSnapshot(qMine, (snap) => {
    mine = snap.docs.map(tripFromDoc);
    emit();
  });

  return () => {
    unsubA();
    unsubB();
  };
}

export function subscribeTrip(
  tripId: string,
  cb: (trip: TripRequest | null) => void,
): () => void {
  const db = getFirestoreDb();
  return onSnapshot(doc(db, "trips", tripId), (snap) => {
    if (!snap.exists()) return cb(null);
    cb(tripFromDoc(snap as QueryDocumentSnapshot<DocumentData>));
  });
}

export async function acceptTrip(
  id: string,
  driverId: string,
  driverName: string,
): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, "trips", id), {
    status: "accepted",
    acceptedByDriverId: driverId,
    acceptedByDriverName: driverName,
    acceptedAt: serverTimestamp(),
  });
}

export async function declineTrip(id: string): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, "trips", id), {
    status: "cancelled",
    cancelledAt: serverTimestamp(),
  });
}

export async function createTripRequest(
  trip: Omit<TripRequest, "id" | "status">,
): Promise<string> {
  const db = getFirestoreDb();
  const created = await addDoc(collection(db, "trips"), {
    ...trip,
    status: "pending" as TripStatus,
    createdAt: serverTimestamp(),
  });
  return created.id;
}

// ── Messages ───────────────────────────────────────────────────────────

export function subscribeMessages(
  tripId: string,
  cb: (messages: TripMessage[]) => void,
): () => void {
  const db = getFirestoreDb();
  const col = collection(db, "trips", tripId, "messages");
  const q = query(col, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as Timestamp | null;
        return {
          id: d.id,
          tripId,
          authorRole: data.authorRole,
          authorUid: data.authorUid,
          authorName: data.authorName,
          body: data.body,
          createdAtIso: ts ? ts.toDate().toISOString() : new Date().toISOString(),
        };
      }),
    );
  });
}

export async function postMessage(
  message: Omit<TripMessage, "id" | "createdAtIso">,
): Promise<void> {
  const db = getFirestoreDb();
  await addDoc(collection(db, "trips", message.tripId, "messages"), {
    authorRole: message.authorRole,
    authorUid: message.authorUid ?? null,
    authorName: message.authorName,
    body: message.body,
    createdAt: serverTimestamp(),
  });
}

// ── GPS pings (Realtime Database) ──────────────────────────────────────

export async function publishPing(ping: DriverPing): Promise<void> {
  const db = getRealtimeDb();
  await rtdbSet(rtdbRef(db, `pings/${ping.tripId}`), {
    ...ping,
    serverTs: rtdbServerTimestamp(),
  });
}

export function subscribePing(
  tripId: string,
  cb: (ping: DriverPing | null) => void,
): () => void {
  const db = getRealtimeDb();
  const node = rtdbRef(db, `pings/${tripId}`);
  const handler = onValue(node, (snap) => {
    const v = snap.val() as DriverPing | null;
    cb(v ?? null);
  });
  return () => off(node, "value", handler);
}

// ── Dev-only: seed sample trips for local testing ──────────────────────

export async function seedSampleTripsIfEmpty(): Promise<void> {
  const db = getFirestoreDb();
  const col = collection(db, "trips");
  const existing = await getDocs(query(col, where("status", "==", "pending")));
  if (!existing.empty) return;

  const now = Date.now();
  const inHours = (h: number) => new Date(now + h * 3_600_000).toISOString();
  const inDays = (d: number) => new Date(now + d * 86_400_000).toISOString();
  const samples: Array<Omit<TripRequest, "id" | "status">> = [
    {
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
      trackingOpensAtIso: inHours(46),
      startsAtIso: inHours(47),
    },
    {
      facilityName: "Attica Correctional Facility",
      facilityCity: "Attica, NY",
      visitDateIso: inDays(3).slice(0, 10),
      visitDateLabel: "Wednesday weekday visit",
      pickupArea: "Niagara Falls — Highland Ave",
      passengers: 6,
      totalDeposit: 300,
      riderName: "Latoya R.",
      riderPhone: "+1 (716) 555-0188",
      trackingOpensAtIso: inHours(70),
      startsAtIso: inHours(71),
    },
  ];
  for (const s of samples) {
    const id = `seed-${Math.random().toString(36).slice(2, 9)}`;
    await setDoc(doc(col, id), {
      ...s,
      status: "pending" as TripStatus,
      createdAt: serverTimestamp(),
    });
  }
}
