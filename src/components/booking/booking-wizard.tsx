"use client";

import { useState } from "react";
import { StepFacility } from "./step-facility";
import { StepInmate } from "./step-inmate";
import { StepDate } from "./step-date";
import { StepPassengers } from "./step-passengers";
import { StepReview } from "./step-review";

export interface BookingData {
  facilityId: string;
  inmateName: string;
  inmateDIN: string;
  inmateLastName: string;
  selectedDate: string; // ISO string
  passengerCount: number;
  childCount: number;
  contactName: string;
  contactPhone: string;
  pickupLocation: string;
}

const STEPS = [
  { id: 1, label: "Facility" },
  { id: 2, label: "Inmate Info" },
  { id: 3, label: "Visit Date" },
  { id: 4, label: "Passengers" },
  { id: 5, label: "Review" },
];

export function BookingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<BookingData>>({});

  const updateData = (partial: Partial<BookingData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                  step >= s.id
                    ? "bg-accent border-accent text-primary-dark"
                    : "border-gray-300 text-gray-400 bg-white"
                }`}
              >
                {s.id}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  step >= s.id ? "text-primary-dark" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 mt-[-1rem] ${
                  step > s.id ? "bg-accent" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {step === 1 && (
          <StepFacility data={data} updateData={updateData} onNext={next} />
        )}
        {step === 2 && (
          <StepInmate
            data={data}
            updateData={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <StepDate
            data={data}
            updateData={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 4 && (
          <StepPassengers
            data={data}
            updateData={updateData}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 5 && <StepReview data={data} onBack={back} />}
      </div>
    </div>
  );
}
