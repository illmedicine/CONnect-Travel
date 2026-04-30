"use client";

import { useMemo, useState } from "react";
import type { BookingData } from "./booking-wizard";
import { DoccsLookupEmbed } from "./doccs-lookup-embed";
import { facilities } from "@/data/facilities";

interface Props {
  data: Partial<BookingData>;
  updateData: (d: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// DIN format: 2-digit year + letter + 4 digits, e.g. 24B1234
const DIN_PATTERN = /^\d{2}[A-Z]\d{4}$/;

export function StepInmate({ data, updateData, onNext, onBack }: Props) {
  const [showLookup, setShowLookup] = useState(false);

  const din = (data.inmateDIN || "").toUpperCase();
  const dinValid = DIN_PATTERN.test(din);
  const dinTouched = din.length > 0;

  const sortedFacilities = useMemo(
    () => [...facilities].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const selectedFacility = facilities.find((f) => f.id === data.facilityId);

  const canProceed =
    dinValid && (data.inmateName || "").trim().length >= 2;

  return (
    <div>
      <h2 className="text-xl font-bold text-primary-dark mb-1">
        Step 2: Inmate Information
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter your loved one&apos;s DIN. We&apos;ll match the visiting schedule to
        the correct facility. Use the official lookup below if you need to
        confirm their current location.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DIN (Departmental Identification Number)
          </label>
          <input
            type="text"
            placeholder="e.g. 24B1234"
            maxLength={7}
            value={din}
            onChange={(e) =>
              updateData({ inmateDIN: e.target.value.toUpperCase() })
            }
            className={`w-full border rounded-xl px-4 py-3 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 ${
              dinTouched && !dinValid
                ? "border-red-300 focus:ring-red-300"
                : "border-gray-200 focus:ring-accent"
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Format: 2-digit year + letter + 4 digits (e.g. <code>24B1234</code>).
          </p>
          {dinTouched && !dinValid && (
            <p className="mt-1 text-xs text-red-600">
              That doesn&apos;t look like a valid DIN format.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Inmate&apos;s Full Name
          </label>
          <input
            type="text"
            placeholder="First Last"
            value={data.inmateName || ""}
            onChange={(e) => {
              const name = e.target.value;
              const parts = name.trim().split(/\s+/);
              updateData({
                inmateName: name,
                inmateLastName: parts[parts.length - 1] || "",
              });
            }}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Facility
          </label>
          <select
            value={data.facilityId || ""}
            onChange={(e) => updateData({ facilityId: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Select facility…</option>
            {sortedFacilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.location}
              </option>
            ))}
          </select>
          {selectedFacility && (
            <p className="mt-1 text-xs text-gray-500">
              Visiting: {selectedFacility.visitingHours.days} ·{" "}
              {selectedFacility.visitingHours.start}–
              {selectedFacility.visitingHours.end}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-primary-dark text-sm">
              🔎 Verify with the official DOCCS Lookup
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Confirm the current facility, parole hearing dates, and release
              info directly from New York State&apos;s Department of Corrections
              and Community Supervision.
            </p>
          </div>
          {!showLookup && (
            <button
              onClick={() => setShowLookup(true)}
              className="shrink-0 bg-primary hover:bg-primary-light text-white font-medium px-4 py-2 rounded-lg transition-colors text-xs"
            >
              Open Lookup
            </button>
          )}
        </div>

        {showLookup && (
          <div className="mt-4">
            <DoccsLookupEmbed
              prefilledDIN={dinValid ? din : undefined}
              onClose={() => setShowLookup(false)}
            />
          </div>
        )}
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
          Next →
        </button>
      </div>
    </div>
  );
}
