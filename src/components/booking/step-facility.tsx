"use client";

import { facilities } from "@/data/facilities";
import type { BookingData } from "./booking-wizard";

interface Props {
  data: Partial<BookingData>;
  updateData: (d: Partial<BookingData>) => void;
  onNext: () => void;
}

export function StepFacility({ data, updateData, onNext }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-primary-dark mb-1">
        Step 1: Select a Facility
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose the correctional facility you plan to visit.
      </p>

      <div className="grid grid-cols-1 gap-3">
        {facilities.map((f) => (
          <button
            key={f.id}
            onClick={() => updateData({ facilityId: f.id })}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
              data.facilityId === f.id
                ? "border-accent bg-accent/5"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-primary-dark">{f.name}</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {f.location} &middot; {f.type.replace("-", " ")} &middot;
                  ~{f.distanceFromBuffalo} mi from Buffalo
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  data.facilityId === f.id
                    ? "border-accent bg-accent"
                    : "border-gray-300"
                }`}
              >
                {data.facilityId === f.id && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Visiting: {f.visitingHours.days}, {f.visitingHours.start} –{" "}
              {f.visitingHours.end} (arrive by {f.visitingHours.latestArrival})
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={!data.facilityId}
          className="bg-accent hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed text-primary-dark font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
