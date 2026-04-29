"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getMessages,
  getTrips,
  postMessage,
  readPing,
  subscribe,
  type DriverPing,
  type TripMessage,
  type TripRequest,
} from "@/lib/driver-data";

const HOUR_MS = 3_600_000;

export default function TrackPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TrackInner />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="min-h-screen grid place-items-center text-sm text-gray-500">
      Loading tracking…
    </div>
  );
}

function TrackInner() {
  const params = useSearchParams();
  const tripId = params.get("trip") ?? "";
  const [trips, setTrips] = useState<TripRequest[]>([]);
  const [ping, setPing] = useState<DriverPing | null>(null);
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [riderName, setRiderName] = useState("");

  useEffect(() => {
    setTrips(getTrips());
    return subscribe(
      (e) => e.type === "trips",
      () => setTrips(getTrips()),
    );
  }, []);

  useEffect(() => {
    if (!tripId) return;
    setPing(readPing(tripId));
    setMessages(getMessages(tripId));
    return subscribe(
      (e) =>
        (e.type === "ping" && e.tripId === tripId) ||
        (e.type === "messages" && e.tripId === tripId),
      () => {
        setPing(readPing(tripId));
        setMessages(getMessages(tripId));
      },
    );
  }, [tripId]);

  const trip = useMemo(
    () => trips.find((t) => t.id === tripId) ?? null,
    [trips, tripId],
  );

  if (!tripId) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-primary-dark">
          No trip specified
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Open the tracking link from your booking confirmation, or paste your
          trip ID into the URL like{" "}
          <code className="bg-gray-100 px-1 rounded">?trip=req-101</code>.
        </p>
      </Shell>
    );
  }

  if (!trip) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-primary-dark">
          Trip not found
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          We couldn&apos;t find a trip with ID <code>{tripId}</code> on this
          device. If you opened this link on a phone different from the one you
          booked on, your driver may not have published a ping yet.
        </p>
      </Shell>
    );
  }

  const startMs = new Date(trip.startsAtIso).getTime();
  const trackingOpensMs = startMs - HOUR_MS;
  const now = Date.now();
  const trackingOpen = now >= trackingOpensMs && now < startMs + 6 * HOUR_MS;
  const minutesUntilOpen = Math.max(
    0,
    Math.round((trackingOpensMs - now) / 60_000),
  );

  const sendMessage = () => {
    const body = draft.trim();
    if (!body) return;
    postMessage({
      tripId,
      authorRole: "rider",
      authorName: riderName.trim() || trip.riderName,
      body,
    });
    setDraft("");
  };

  return (
    <Shell>
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Trip {trip.id} · {trip.visitDateLabel}
        </p>
        <h1 className="text-xl font-bold text-primary-dark">
          {trip.facilityName}
        </h1>
        <p className="text-sm text-gray-600">Pickup: {trip.pickupArea}</p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-primary-dark">Driver location</h2>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              trackingOpen
                ? "bg-emerald-100 text-emerald-800"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {trackingOpen ? "Live" : "Opens at T-1h"}
          </span>
        </div>

        {!trackingOpen ? (
          <p className="mt-3 text-sm text-gray-600">
            Live GPS tracking opens automatically{" "}
            <strong>1 hour before pickup</strong>
            {minutesUntilOpen > 0 && (
              <> — about {formatCountdown(minutesUntilOpen)} from now</>
            )}
            . Your driver&apos;s privacy is protected outside that window.
          </p>
        ) : ping ? (
          <>
            <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-gray-200">
              <iframe
                title="Driver location map"
                className="w-full h-full"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  ping.lng - 0.02
                }%2C${ping.lat - 0.02}%2C${ping.lng + 0.02}%2C${
                  ping.lat + 0.02
                }&layer=mapnik&marker=${ping.lat}%2C${ping.lng}`}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {ping.driverName} · last update{" "}
              {new Date(ping.capturedAtIso).toLocaleTimeString()}
            </p>
            <a
              href={`https://www.openstreetmap.org/?mlat=${ping.lat}&mlon=${ping.lng}#map=15/${ping.lat}/${ping.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-primary font-semibold underline"
            >
              Open full map
            </a>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-600">
            Tracking window is open but your driver hasn&apos;t turned on
            location sharing yet. Send them a message below.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-primary-dark">
          Message your driver
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {trip.acceptedByDriverName
            ? `Connected with ${trip.acceptedByDriverName}.`
            : "A driver will be assigned shortly."}
        </p>

        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No messages yet.
            </p>
          )}
          {messages.map((m) => {
            const mine = m.authorRole === "rider";
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-accent text-primary-dark rounded-br-sm"
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

        <div className="mt-3 space-y-2">
          <input
            value={riderName}
            onChange={(e) => setRiderName(e.target.value)}
            placeholder={`Your name (default: ${trip.riderName})`}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!draft.trim()}
              className="bg-primary text-white rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">{children}</main>
    </div>
  );
}

function formatCountdown(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
