"use client";

import type { BookingData } from "./booking-wizard";

interface Props {
  data: Partial<BookingData>;
  updateData: (d: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepPassengers({ data, updateData, onNext, onBack }: Props) {
  const adults = data.passengerCount ?? 1;
  const children = data.childCount ?? 0;

  const canProceed =
    adults >= 1 &&
    adults <= 3 &&
    children <= 1 &&
    data.contactName &&
    data.contactPhone;

  return (
    <div>
      <h2 className="text-xl font-bold text-primary-dark mb-1">
        Step 4: Passenger Details
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        DOCCS allows a maximum of 3 adults and 1 child (under 5) per visit.
      </p>

      <div className="space-y-6">
        {/* Adult count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Adults (seats @ $50 each)
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                updateData({ passengerCount: Math.max(1, adults - 1) })
              }
              className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
            >
              −
            </button>
            <span className="text-2xl font-bold text-primary-dark w-8 text-center">
              {adults}
            </span>
            <button
              onClick={() =>
                updateData({ passengerCount: Math.min(3, adults + 1) })
              }
              className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
            >
              +
            </button>
            <span className="text-sm text-gray-400 ml-2">Max 3</span>
          </div>
        </div>

        {/* Child count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Children Under 5 (lap seating, free)
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                updateData({ childCount: Math.max(0, children - 1) })
              }
              className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
            >
              −
            </button>
            <span className="text-2xl font-bold text-primary-dark w-8 text-center">
              {children}
            </span>
            <button
              onClick={() =>
                updateData({ childCount: Math.min(1, children + 1) })
              }
              className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
            >
              +
            </button>
            <span className="text-sm text-gray-400 ml-2">Max 1</span>
          </div>
        </div>

        {/* Contact info */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-primary-dark mb-4">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Full name"
                value={data.contactName || ""}
                onChange={(e) => updateData({ contactName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="(716) 555-0123"
                value={data.contactPhone || ""}
                onChange={(e) => updateData({ contactPhone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Pickup */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Pickup Location in Buffalo
          </label>
          <input
            type="text"
            placeholder="e.g. Galleria Mall parking lot, Downtown bus terminal..."
            value={data.pickupLocation || ""}
            onChange={(e) => updateData({ pickupLocation: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <p className="text-xs text-gray-400 mt-1">
            The driver will coordinate a central meetup — this is a preference.
          </p>
        </div>

        {/* Cost summary */}
        <div className="bg-accent/10 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-primary-dark">
              {adults} seat{adults > 1 ? "s" : ""} × $50
            </span>
            <span className="text-xl font-bold text-primary-dark">
              ${adults * 50}.00
            </span>
          </div>
          {children > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              + {children} child (lap seating, no charge)
            </p>
          )}
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
          onClick={onNext}
          disabled={!canProceed}
          className="bg-accent hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed text-primary-dark font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Review Booking →
        </button>
      </div>
    </div>
  );
}
