"use client";

import { useState } from "react";
import { facilities } from "@/data/facilities";

interface PendingTrip {
  id: string;
  facility: string;
  date: string;
  passengers: number;
  totalDeposit: number;
  deadline: string;
}

// Sample data — in production this comes from the API
const sampleTrips: PendingTrip[] = [
  {
    id: "trip-001",
    facility: "Wende Correctional Facility",
    date: "Saturday, Apr 26, 2026",
    passengers: 8,
    totalDeposit: 400,
    deadline: "Apr 25, 6:00 AM",
  },
  {
    id: "trip-002",
    facility: "Collins Correctional Facility",
    date: "Sunday, Apr 27, 2026",
    passengers: 5,
    totalDeposit: 250,
    deadline: "Apr 26, 6:00 AM",
  },
  {
    id: "trip-003",
    facility: "Wyoming Correctional Facility",
    date: "Saturday, May 3, 2026",
    passengers: 11,
    totalDeposit: 550,
    deadline: "May 2, 6:00 AM",
  },
  {
    id: "trip-004",
    facility: "Albion Correctional Facility",
    date: "Saturday, May 3, 2026",
    passengers: 3,
    totalDeposit: 150,
    deadline: "May 2, 6:00 AM",
  },
];

export function DriverDashboard() {
  const [view, setView] = useState<"available" | "register">("available");
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const handleAccept = (tripId: string) => {
    setAccepted((prev) => new Set(prev).add(tripId));
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-primary-dark">
          Driver Dashboard
        </h1>
        <p className="mt-2 text-gray-500">
          Pick up trips, manage your routes, and earn money helping families
          connect.
        </p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-8 justify-center">
        <button
          onClick={() => setView("available")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            view === "available"
              ? "bg-primary text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Available Trips
        </button>
        <button
          onClick={() => setView("register")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            view === "register"
              ? "bg-primary text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Vehicle Registration
        </button>
      </div>

      {view === "available" ? (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Available Trips" value={String(sampleTrips.length)} />
            <StatCard
              label="Total Passengers"
              value={String(sampleTrips.reduce((s, t) => s + t.passengers, 0))}
            />
            <StatCard label="Your Completed" value="0" />
            <StatCard label="Your Rating" value="—" />
          </div>

          {/* Facility filter summary */}
          <div className="mb-6">
            <h2 className="font-bold text-primary-dark text-lg mb-3">
              Pending Deposits by Facility
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {facilities.map((f) => {
                const trips = sampleTrips.filter(
                  (t) => t.facility === f.name
                );
                const totalPax = trips.reduce(
                  (s, t) => s + t.passengers,
                  0
                );
                return (
                  <div
                    key={f.id}
                    className="bg-white rounded-xl p-4 border border-gray-100"
                  >
                    <div className="font-semibold text-sm text-primary-dark">
                      {f.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {trips.length} trip{trips.length !== 1 ? "s" : ""} &middot;{" "}
                      {totalPax} passenger{totalPax !== 1 ? "s" : ""} waiting
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trip list */}
          <h2 className="font-bold text-primary-dark text-lg mb-3">
            Available Trips
          </h2>
          <div className="space-y-4">
            {sampleTrips.map((trip) => {
              const isAccepted = accepted.has(trip.id);
              const netEarning = trip.totalDeposit * 0.9;
              return (
                <div
                  key={trip.id}
                  className={`bg-white rounded-xl p-6 border transition-colors ${
                    isAccepted
                      ? "border-success bg-green-50/50"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-primary-dark">
                        {trip.facility}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {trip.date}
                      </div>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-gray-600">
                          👥 {trip.passengers} passengers
                        </span>
                        <span className="text-gray-600">
                          💰 ${trip.totalDeposit} pool
                        </span>
                        <span className="font-semibold text-success">
                          You earn: ${netEarning.toFixed(0)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Accept by: {trip.deadline}
                      </div>
                    </div>
                    <div>
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 bg-success text-white px-6 py-2.5 rounded-xl font-semibold text-sm">
                          ✓ Accepted
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAccept(trip.id)}
                          className="bg-accent hover:bg-accent-light text-primary-dark font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
                        >
                          Accept Trip
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <VehicleRegistration />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
      <div className="text-2xl font-bold text-primary-dark">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function VehicleRegistration() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
      <h2 className="text-xl font-bold text-primary-dark mb-1">
        Register Your Vehicle
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Complete your driver profile to start accepting trips. All information
        is verified for passenger safety.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Vehicle Make" placeholder="e.g. Ford" />
          <InputField label="Vehicle Model" placeholder="e.g. Transit" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Year" placeholder="e.g. 2022" />
          <InputField label="Color" placeholder="e.g. White" />
        </div>
        <InputField
          label="Passenger Capacity"
          placeholder="e.g. 12"
          type="number"
        />
        <InputField
          label="License Plate Number"
          placeholder="e.g. ABC-1234"
        />
        <InputField
          label="Vehicle Registration Number"
          placeholder="Registration #"
        />
        <InputField
          label="Driver's License Number"
          placeholder="License #"
        />

        <div className="pt-4">
          <button className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-xl transition-colors">
            Submit for Verification
          </button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Verification typically takes 24–48 hours. You&apos;ll be notified once
            approved.
          </p>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
