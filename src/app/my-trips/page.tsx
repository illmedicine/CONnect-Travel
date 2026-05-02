"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  onIdentityChange,
  signInWithGoogle,
  type DriverIdentity,
} from "@/lib/driver-auth";
import {
  subscribeRiderTrips,
  cancelTripByRider,
  type TripRequest,
  type TripStatus,
} from "@/lib/driver-data";

const STATUS_LABEL: Record<TripStatus, string> = {
  pending: "Awaiting Driver",
  accepted: "Driver Confirmed",
  en_route: "Driver En Route",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<TripStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  en_route: "bg-emerald-100 text-emerald-800",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-800",
};

export default function MyTripsPage() {
  const [identity, setIdentity] = useState<DriverIdentity | null>(null);
  const [identityLoaded, setIdentityLoaded] = useState(false);
  const [trips, setTrips] = useState<TripRequest[] | null>(null);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  useEffect(() => {
    return onIdentityChange((id) => {
      setIdentity(id);
      setIdentityLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!identity) {
      setTrips(null);
      return;
    }
    return subscribeRiderTrips(identity.uid, setTrips);
  }, [identity]);

  if (!identityLoaded) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-primary-dark">My Trips</h1>
        <p className="mt-3 text-gray-600">
          Sign in with Google to see all the rides you&apos;ve booked. Your
          bookings sync across every device automatically.
        </p>
        <button
          onClick={async () => {
            try {
              await signInWithGoogle();
            } catch (e) {
              alert((e as Error).message || "Sign in failed");
            }
          }}
          className="mt-6 bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  const now = Date.now();
  const all = trips ?? [];
  const upcoming = all.filter(
    (t) =>
      t.status !== "cancelled" &&
      t.status !== "completed" &&
      new Date(t.startsAtIso).getTime() > now,
  );
  const past = all.filter(
    (t) =>
      t.status === "completed" ||
      t.status === "cancelled" ||
      new Date(t.startsAtIso).getTime() <= now,
  );
  const visible =
    filter === "upcoming" ? upcoming : filter === "past" ? past : all;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark">My Trips</h1>
          <p className="text-sm text-gray-500 mt-1">
            Signed in as {identity.email}
          </p>
        </div>
        <Link
          href="/book"
          className="bg-accent hover:bg-accent/90 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          + New Booking
        </Link>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(["upcoming", "past", "all"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === k
                ? "border-accent text-primary-dark"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {k.charAt(0).toUpperCase() + k.slice(1)}
            <span className="ml-1.5 text-xs text-gray-400">
              {k === "upcoming"
                ? upcoming.length
                : k === "past"
                  ? past.length
                  : all.length}
            </span>
          </button>
        ))}
      </div>

      {trips === null ? (
        <p className="text-center text-gray-500 py-12">Loading your trips…</p>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-500">
            {filter === "upcoming"
              ? "No upcoming trips."
              : filter === "past"
                ? "No past trips yet."
                : "You haven't booked any trips yet."}
          </p>
          <Link
            href="/book"
            className="inline-block mt-4 bg-primary hover:bg-primary-light text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            Book your first ride
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TripCard({ trip }: { trip: TripRequest }) {
  const [busy, setBusy] = useState(false);
  const dateLabel = trip.visitDateLabel || trip.visitDateIso;
  const canCancel = trip.status === "pending" || trip.status === "accepted";

  return (
    <li className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <p className="font-semibold text-primary-dark">{trip.facilityName}</p>
          <p className="text-sm text-gray-500">{trip.facilityCity}</p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLE[trip.status]}`}
        >
          {STATUS_LABEL[trip.status]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Visit Date
          </p>
          <p className="text-gray-700">{dateLabel}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Passengers
          </p>
          <p className="text-gray-700">{trip.passengers}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Pickup
          </p>
          <p className="text-gray-700">{trip.pickupArea || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Deposit
          </p>
          <p className="text-gray-700">${trip.totalDeposit}</p>
        </div>
      </div>

      {trip.acceptedByDriverName && (
        <p className="mt-3 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
          🚐 Driver: <strong>{trip.acceptedByDriverName}</strong>
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2 flex-wrap">
        {(trip.status === "accepted" || trip.status === "en_route") && (
          <Link
            href={`/track?trip=${trip.id}`}
            className="text-sm font-semibold text-primary hover:text-primary-light px-4 py-2 rounded-lg border border-primary/20 hover:bg-primary/5"
          >
            Open Trip & Message
          </Link>
        )}
        {canCancel && (
          <button
            disabled={busy}
            onClick={async () => {
              if (!confirm("Cancel this booking?")) return;
              setBusy(true);
              try {
                await cancelTripByRider(trip.id);
              } catch (e) {
                alert(
                  (e as Error).message ||
                    "Could not cancel. Try again.",
                );
              } finally {
                setBusy(false);
              }
            }}
            className="text-sm font-medium text-red-600 hover:text-red-700 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50"
          >
            {busy ? "Cancelling…" : "Cancel"}
          </button>
        )}
      </div>
    </li>
  );
}
