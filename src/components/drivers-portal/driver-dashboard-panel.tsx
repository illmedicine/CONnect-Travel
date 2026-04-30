"use client";

import { useEffect, useMemo, useState } from "react";
import {
  acceptTrip,
  declineTrip,
  postMessage,
  publishPing,
  subscribeDriverTrips,
  subscribeMessages,
  subscribePing,
  type DriverPing,
  type TripMessage,
  type TripRequest,
} from "@/lib/driver-data";
import type { DriverIdentity } from "@/lib/driver-auth";

interface Props {
  identity: DriverIdentity;
}

type Tab = "available" | "active" | "completed";

const HOUR_MS = 3_600_000;

function timeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "now";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `in ${hours} h`;
  return `in ${Math.round(hours / 24)} d`;
}

function isTrackingWindow(trip: TripRequest): boolean {
  const start = new Date(trip.startsAtIso).getTime();
  return start - Date.now() <= HOUR_MS && Date.now() < start + 6 * HOUR_MS;
}

export default function DriverDashboardPanel({ identity }: Props) {
  const [tab, setTab] = useState<Tab>("available");
  const [trips, setTrips] = useState<TripRequest[]>([]);
  const [openTripId, setOpenTripId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeDriverTrips(identity.uid, setTrips);
  }, [identity.uid]);

  const groups = useMemo(() => {
    const myId = identity.uid;
    const available = trips.filter((t) => t.status === "pending");
    const active = trips.filter(
      (t) =>
        (t.status === "accepted" || t.status === "en_route") &&
        t.acceptedByDriverId === myId,
    );
    const completed = trips.filter(
      (t) => t.status === "completed" && t.acceptedByDriverId === myId,
    );
    return { available, active, completed };
  }, [trips, identity.uid]);

  const visible = groups[tab];
  const activeTrip = trips.find((t) => t.id === openTripId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sticky top-16 bg-white z-10">
        {(
          [
            ["available", `Available · ${groups.available.length}`],
            ["active", `My Trips · ${groups.active.length}`],
            ["completed", `History · ${groups.completed.length}`],
          ] as Array<[Tab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === id
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          {tab === "available"
            ? "No open trip requests right now. New requests appear in real time."
            : tab === "active"
              ? "You haven't accepted any trips yet."
              : "Completed trips will show up here."}
        </div>
      )}

      <ul className="space-y-3">
        {visible.map((trip) => (
          <li
            key={trip.id}
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {trip.visitDateLabel} · {timeUntil(trip.startsAtIso)}
                </p>
                <h3 className="mt-1 font-bold text-primary-dark truncate">
                  {trip.facilityName}
                </h3>
                <p className="text-sm text-gray-600">
                  Pickup: {trip.pickupArea}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                  trip.status === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : trip.status === "accepted"
                      ? "bg-emerald-100 text-emerald-800"
                      : trip.status === "en_route"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700"
                }`}
              >
                {trip.status.replace("_", " ")}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-gray-50 p-2">
                <dt className="text-gray-500">Riders</dt>
                <dd className="font-bold text-primary-dark text-base">
                  {trip.passengers}
                </dd>
              </div>
              <div className="rounded-lg bg-gray-50 p-2">
                <dt className="text-gray-500">Deposit</dt>
                <dd className="font-bold text-primary-dark text-base">
                  ${trip.totalDeposit}
                </dd>
              </div>
              <div className="rounded-lg bg-gray-50 p-2">
                <dt className="text-gray-500">Tracking opens</dt>
                <dd className="font-bold text-primary-dark text-base">
                  {timeUntil(trip.trackingOpensAtIso)}
                </dd>
              </div>
            </dl>

            {trip.notes && (
              <p className="mt-3 text-sm text-gray-700 bg-amber-50 border-l-4 border-amber-300 p-2 rounded">
                {trip.notes}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {trip.status === "pending" && (
                <>
                  <button
                    onClick={() =>
                      acceptTrip(trip.id, identity.uid, identity.name)
                    }
                    className="flex-1 min-w-[8rem] bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    Accept trip
                  </button>
                  <button
                    onClick={() => declineTrip(trip.id)}
                    className="flex-1 min-w-[8rem] bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2 rounded-lg transition-colors"
                  >
                    Pass
                  </button>
                </>
              )}
              {(trip.status === "accepted" || trip.status === "en_route") && (
                <button
                  onClick={() => setOpenTripId(trip.id)}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  Open trip
                </button>
              )}
              <a
                href={`tel:${trip.riderPhone.replace(/[^+\d]/g, "")}`}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Call rider
              </a>
            </div>
          </li>
        ))}
      </ul>

      {activeTrip && (
        <ActiveTripSheet
          trip={activeTrip}
          identity={identity}
          onClose={() => setOpenTripId(null)}
          trackingOpen={isTrackingWindow(activeTrip)}
        />
      )}
    </div>
  );
}

interface SheetProps {
  trip: TripRequest;
  identity: DriverIdentity;
  trackingOpen: boolean;
  onClose: () => void;
}

function ActiveTripSheet({ trip, identity, trackingOpen, onClose }: SheetProps) {
  const [tab, setTab] = useState<"messages" | "gps">("messages");
  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-bold text-primary-dark truncate">
              {trip.facilityName}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              Rider: {trip.riderName} · {trip.passengers} passengers
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b">
          {(
            [
              ["messages", "Messages"],
              ["gps", trackingOpen ? "GPS · live" : "GPS · pre-trip"],
            ] as Array<["messages" | "gps", string]>
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 text-sm font-semibold ${
                tab === id
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "messages" ? (
            <MessageThread trip={trip} identity={identity} />
          ) : (
            <GpsPanel trip={trip} identity={identity} trackingOpen={trackingOpen} />
          )}
        </div>
      </div>
    </div>
  );
}

function MessageThread({
  trip,
  identity,
}: {
  trip: TripRequest;
  identity: DriverIdentity;
}) {
  const [items, setItems] = useState<TripMessage[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => subscribeMessages(trip.id, setItems), [trip.id]);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    void postMessage({
      tripId: trip.id,
      authorRole: "driver",
      authorUid: identity.uid,
      authorName: identity.given_name ?? identity.name,
      body,
    });
    setDraft("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 space-y-2">
        {items.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8">
            No messages yet. Say hi to {trip.riderName.split(" ")[0]}.
          </p>
        )}
        {items.map((m) => {
          const mine = m.authorRole === "driver";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                <p className="text-[10px] opacity-70 mb-0.5">
                  {m.authorName} ·{" "}
                  {new Date(m.createdAtIso).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form
        className="border-t p-2 flex gap-2 bg-white sticky bottom-0"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${trip.riderName.split(" ")[0]}…`}
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="bg-primary text-white rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
          disabled={!draft.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

function GpsPanel({
  trip,
  identity,
  trackingOpen,
}: {
  trip: TripRequest;
  identity: DriverIdentity;
  trackingOpen: boolean;
}) {
  const [sharing, setSharing] = useState(false);
  const [latest, setLatest] = useState<DriverPing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => subscribePing(trip.id, setLatest), [trip.id]);

  useEffect(() => {
    return () => {
      if (watchId !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const start = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This device does not expose a Geolocation API.");
      return;
    }
    setError(null);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const ping: DriverPing = {
          tripId: trip.id,
          driverId: identity.uid,
          driverName: identity.name,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
          accuracy: pos.coords.accuracy,
          capturedAtIso: new Date(pos.timestamp).toISOString(),
        };
        void publishPing(ping);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );
    setWatchId(id);
    setSharing(true);
  };

  const stop = () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
    setSharing(false);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <p className="font-semibold">Live tracking policy</p>
        <p className="mt-1">
          Riders can see your location starting{" "}
          <strong>1 hour before pickup</strong> and until the trip ends.
          Outside that window, sharing is disabled to protect your privacy.
        </p>
      </div>

      {!trackingOpen ? (
        <p className="text-sm text-gray-600">
          The tracking window opens 1 hour before pickup. You can pre-test the
          permission below; pings stay in Firebase but won&apos;t be visible to
          riders until the window opens.
        </p>
      ) : (
        <p className="text-sm text-emerald-700 font-semibold">
          Tracking window is open — your rider can see your live position.
        </p>
      )}

      {!sharing ? (
        <button
          onClick={start}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg"
        >
          Start sharing my location
        </button>
      ) : (
        <button
          onClick={stop}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg"
        >
          Stop sharing
        </button>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </p>
      )}

      {latest && (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 rounded p-2">
            <dt className="text-xs text-gray-500">Latitude</dt>
            <dd className="font-mono">{latest.lat.toFixed(5)}</dd>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <dt className="text-xs text-gray-500">Longitude</dt>
            <dd className="font-mono">{latest.lng.toFixed(5)}</dd>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <dt className="text-xs text-gray-500">Accuracy</dt>
            <dd className="font-mono">
              {latest.accuracy ? `${Math.round(latest.accuracy)} m` : "—"}
            </dd>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <dt className="text-xs text-gray-500">Updated</dt>
            <dd className="font-mono">
              {new Date(latest.capturedAtIso).toLocaleTimeString()}
            </dd>
          </div>
        </dl>
      )}

      <p className="text-xs text-gray-500">
        Trip ID: <code>{trip.id}</code> — share this with the rider so they can
        open the tracking page.
      </p>
    </div>
  );
}
