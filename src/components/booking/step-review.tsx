"use client";

import { useEffect, useState } from "react";
import { getFacilityById } from "@/data/facilities";
import type { BookingData } from "./booking-wizard";
import { createTripRequest } from "@/lib/driver-data";
import {
  onIdentityChange,
  signInWithGoogle,
  type DriverIdentity,
} from "@/lib/driver-auth";

interface Props {
  data: Partial<BookingData>;
  onBack: () => void;
}

export function StepReview({ data, onBack }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<DriverIdentity | null>(null);

  useEffect(() => onIdentityChange(setIdentity), []);

  const facility = data.facilityId
    ? getFacilityById(data.facilityId)
    : undefined;
  const adults = data.passengerCount ?? 1;
  const total = adults * 50;

  const visitDate = data.selectedDate
    ? new Date(data.selectedDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const handleSubmit = async () => {
    setError(null);

    // Require sign-in so the booking is tied to the user's account and shows
    // up under "My Trips" across devices.
    let me = identity;
    if (!me) {
      try {
        me = await signInWithGoogle();
      } catch (e) {
        setError(
          (e as Error).message ||
            "Sign in with Google to save this booking.",
        );
        return;
      }
      if (!me) {
        setError("Sign in with Google to save this booking.");
        return;
      }
    }

    if (!facility || !data.selectedDate) {
      setError("Booking is missing facility or date.");
      return;
    }

    setSubmitting(true);
    try {
      // Visiting hours: parse facility.visitingHours.start ("e.g. 9:00 AM")
      // into a Date for the visit. Fall back to mid-morning.
      const startsAt = new Date(data.selectedDate);
      const hoursMatch = facility.visitingHours.start.match(
        /(\d{1,2}):?(\d{2})?\s*(AM|PM)/i,
      );
      if (hoursMatch) {
        let h = parseInt(hoursMatch[1], 10);
        const m = parseInt(hoursMatch[2] || "0", 10);
        const ampm = hoursMatch[3].toUpperCase();
        if (ampm === "PM" && h !== 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        startsAt.setHours(h, m, 0, 0);
      } else {
        startsAt.setHours(10, 0, 0, 0);
      }
      const trackingOpensAt = new Date(startsAt.getTime() - 60 * 60 * 1000);

      const id = await createTripRequest({
        facilityName: facility.name,
        facilityCity: facility.location,
        visitDateIso: data.selectedDate,
        visitDateLabel: visitDate,
        pickupArea: data.pickupLocation || "No preference",
        passengers: adults,
        totalDeposit: total,
        riderName: data.contactName || me.name,
        riderPhone: data.contactPhone || "",
        riderUid: me.uid,
        notes: data.inmateName
          ? `Inmate: ${data.inmateName} (DIN ${data.inmateDIN ?? ""})`
          : undefined,
        trackingOpensAtIso: trackingOpensAt.toISOString(),
        startsAtIso: startsAt.toISOString(),
      });
      setTripId(id);
      setSubmitted(true);
    } catch (e) {
      setError(
        (e as Error).message ||
          "Could not save your booking. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-primary-dark">
          Booking Request Submitted!
        </h2>
        <p className="mt-3 text-gray-600 max-w-md mx-auto">
          Your seats are reserved. You have <strong>24 hours</strong> to
          complete payment. Once a driver accepts the pool, you&apos;ll receive
          confirmation with their details.
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-800 max-w-sm mx-auto">
          <strong>Escrow Protection:</strong> If no driver accepts by T-minus 12
          hours, you&apos;ll get a 100% automatic refund.
        </div>
        {tripId && (
          <p className="mt-4 text-xs text-gray-400">
            Booking ID: <span className="font-mono">{tripId}</span>
          </p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <a
            href="/my-trips"
            className="bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            View My Trips
          </a>
          <a
            href="/"
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-primary-dark mb-1">
        Step 5: Review & Confirm
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Double-check everything before submitting.
      </p>

      <div className="space-y-4">
        <ReviewRow label="Facility" value={facility?.name || "—"} />
        <ReviewRow
          label="Facility Location"
          value={facility?.location || "—"}
        />
        <ReviewRow label="Inmate" value={data.inmateName || "—"} />
        <ReviewRow label="DIN" value={data.inmateDIN || "—"} />
        <ReviewRow label="Visit Date" value={visitDate} />
        <ReviewRow
          label="Visiting Hours"
          value={
            facility
              ? `${facility.visitingHours.start} – ${facility.visitingHours.end}`
              : "—"
          }
        />
        <ReviewRow label="Adult Seats" value={String(adults)} />
        <ReviewRow
          label="Children"
          value={String(data.childCount ?? 0)}
        />
        <ReviewRow label="Contact" value={data.contactName || "—"} />
        <ReviewRow label="Phone" value={data.contactPhone || "—"} />
        <ReviewRow
          label="Pickup Preference"
          value={data.pickupLocation || "No preference"}
        />

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center text-lg">
            <span className="font-bold text-primary-dark">
              Total Due (Escrow Deposit)
            </span>
            <span className="font-bold text-2xl text-accent">
              ${total}.00
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Payment must be completed within 24 hours or the booking
            auto-cancels.
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center gap-3">
        <button
          onClick={onBack}
          disabled={submitting}
          className="text-gray-500 hover:text-gray-700 font-medium px-6 py-3 transition-colors disabled:opacity-40"
        >
          ← Back
        </button>
        <div className="flex flex-col items-end gap-2">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-success hover:bg-green-600 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg"
          >
            {submitting
              ? "Submitting…"
              : identity
                ? `Confirm & Pay $${total}.00`
                : `Sign in & Confirm $${total}.00`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-primary-dark text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}
