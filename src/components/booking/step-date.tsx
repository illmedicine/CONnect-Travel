"use client";

import { getFacilityById } from "@/data/facilities";
import { getNextVisitingDates } from "@/data/visiting-rules";
import type { BookingData } from "./booking-wizard";

interface Props {
  data: Partial<BookingData>;
  updateData: (d: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepDate({ data, updateData, onNext, onBack }: Props) {
  const facility = data.facilityId
    ? getFacilityById(data.facilityId)
    : undefined;

  const validDates = facility
    ? getNextVisitingDates(
        facility.visitingRules,
        8,
        data.inmateDIN,
        data.inmateLastName
      )
    : [];

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const formatShort = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  return (
    <div>
      <h2 className="text-xl font-bold text-primary-dark mb-1">
        Step 3: Choose a Visit Date
      </h2>
      <p className="text-sm text-gray-500 mb-2">
        Dates shown are valid visiting days for{" "}
        <strong>{facility?.name || "the selected facility"}</strong>
        {data.inmateDIN && (
          <>
            {" "}
            based on DIN <strong>{data.inmateDIN}</strong>
          </>
        )}
        .
      </p>

      {facility && (
        <div className="mb-6 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <strong>Hours:</strong> {facility.visitingHours.start} –{" "}
          {facility.visitingHours.end} &middot; Latest arrival:{" "}
          {facility.visitingHours.latestArrival}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {validDates.map((d) => {
          const iso = d.toISOString();
          const isSelected = data.selectedDate === iso;
          return (
            <button
              key={iso}
              onClick={() => updateData({ selectedDate: iso })}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
                isSelected
                  ? "border-accent bg-accent/5"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="font-semibold text-primary-dark">
                {formatShort(d)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {formatDate(d)}
              </div>
            </button>
          );
        })}
      </div>

      {validDates.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          No valid visiting dates found. Please check the facility and inmate
          information.
        </p>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 font-medium px-6 py-3 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!data.selectedDate}
          className="bg-accent hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed text-primary-dark font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
