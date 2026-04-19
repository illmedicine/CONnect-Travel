"use client";

import { useState } from "react";
import { getFacilityById } from "@/data/facilities";
import type { BookingData } from "./booking-wizard";

interface Props {
  data: Partial<BookingData>;
  onBack: () => void;
}

export function StepReview({ data, onBack }: Props) {
  const [submitted, setSubmitted] = useState(false);
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

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 font-medium px-6 py-3 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => setSubmitted(true)}
          className="bg-success hover:bg-green-600 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg"
        >
          Confirm & Pay ${total}.00
        </button>
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
