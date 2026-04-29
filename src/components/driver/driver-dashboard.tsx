"use client";

import { useMemo, useState } from "react";
import { facilities } from "@/data/facilities";

type ShiftType = "weekday" | "weekend";

interface PendingTrip {
  id: string;
  facility: string;
  date: string;
  /** ISO date string used to derive shift type. */
  iso: string;
  passengers: number;
  totalDeposit: number;
  deadline: string;
  /** Approximate one-way drive time from Buffalo (minutes). */
  driveMinutes: number;
}

// Sample data — in production this comes from the API
const sampleTrips: PendingTrip[] = [
  // Weekend trips
  {
    id: "trip-001",
    facility: "Wende Correctional Facility",
    date: "Saturday, May 2, 2026",
    iso: "2026-05-02",
    passengers: 8,
    totalDeposit: 400,
    deadline: "May 1, 6:00 AM",
    driveMinutes: 30,
  },
  {
    id: "trip-002",
    facility: "Collins Correctional Facility",
    date: "Sunday, May 3, 2026",
    iso: "2026-05-03",
    passengers: 5,
    totalDeposit: 250,
    deadline: "May 2, 6:00 AM",
    driveMinutes: 50,
  },
  {
    id: "trip-003",
    facility: "Wyoming Correctional Facility",
    date: "Saturday, May 9, 2026",
    iso: "2026-05-09",
    passengers: 11,
    totalDeposit: 550,
    deadline: "May 8, 6:00 AM",
    driveMinutes: 55,
  },
  {
    id: "trip-004",
    facility: "Albion Correctional Facility",
    date: "Saturday, May 9, 2026",
    iso: "2026-05-09",
    passengers: 3,
    totalDeposit: 150,
    deadline: "May 8, 6:00 AM",
    driveMinutes: 55,
  },
  // Weekday trips (new)
  {
    id: "trip-005",
    facility: "Attica Correctional Facility",
    date: "Wednesday, May 6, 2026",
    iso: "2026-05-06",
    passengers: 7,
    totalDeposit: 350,
    deadline: "May 5, 6:00 AM",
    driveMinutes: 60,
  },
  {
    id: "trip-006",
    facility: "Wende Correctional Facility",
    date: "Wednesday, May 6, 2026",
    iso: "2026-05-06",
    passengers: 6,
    totalDeposit: 300,
    deadline: "May 5, 6:00 AM",
    driveMinutes: 30,
  },
  {
    id: "trip-007",
    facility: "Five Points Correctional Facility",
    date: "Wednesday, May 13, 2026",
    iso: "2026-05-13",
    passengers: 9,
    totalDeposit: 450,
    deadline: "May 12, 6:00 AM",
    driveMinutes: 140,
  },
  {
    id: "trip-008",
    facility: "Auburn Correctional Facility",
    date: "Wednesday, May 13, 2026",
    iso: "2026-05-13",
    passengers: 4,
    totalDeposit: 200,
    deadline: "May 12, 6:00 AM",
    driveMinutes: 150,
  },
  {
    id: "trip-009",
    facility: "Elmira Correctional Facility",
    date: "Thursday, May 14, 2026",
    iso: "2026-05-14",
    passengers: 6,
    totalDeposit: 300,
    deadline: "May 13, 6:00 AM",
    driveMinutes: 165,
  },
];

function getShiftType(iso: string): ShiftType {
  const day = new Date(iso + "T00:00:00").getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

export function DriverDashboard() {
  const [view, setView] = useState<"available" | "register">("available");
  const [shiftFilter, setShiftFilter] = useState<"all" | ShiftType>("all");
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const handleAccept = (tripId: string) => {
    setAccepted((prev) => new Set(prev).add(tripId));
  };

  const visibleTrips = useMemo(() => {
    if (shiftFilter === "all") return sampleTrips;
    return sampleTrips.filter((t) => getShiftType(t.iso) === shiftFilter);
  }, [shiftFilter]);

  const weekdayCount = sampleTrips.filter((t) => getShiftType(t.iso) === "weekday").length;
  const weekendCount = sampleTrips.length - weekdayCount;

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
            <StatCard label="Weekday Shifts" value={String(weekdayCount)} accent />
            <StatCard label="Weekend Shifts" value={String(weekendCount)} />
            <StatCard
              label="Total Passengers"
              value={String(sampleTrips.reduce((s, t) => s + t.passengers, 0))}
            />
          </div>

          {/* Shift type filter */}
          <div className="mb-6">
            <h2 className="font-bold text-primary-dark text-lg mb-3">
              Pick Up a Shift
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Weekday routes serve facilities with Wed/Thu visiting hours
              (Wende, Attica, Auburn, Five Points, Elmira). Less competition,
              same $50/seat pool.
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterPill
                label={`All shifts (${sampleTrips.length})`}
                active={shiftFilter === "all"}
                onClick={() => setShiftFilter("all")}
              />
              <FilterPill
                label={`Weekday (${weekdayCount})`}
                active={shiftFilter === "weekday"}
                onClick={() => setShiftFilter("weekday")}
              />
              <FilterPill
                label={`Weekend (${weekendCount})`}
                active={shiftFilter === "weekend"}
                onClick={() => setShiftFilter("weekend")}
              />
            </div>
          </div>

          {/* Facility filter summary */}
          <div className="mb-6">
            <h2 className="font-bold text-primary-dark text-lg mb-3">
              Pending Deposits by Facility
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {facilities.map((f) => {
                const trips = sampleTrips.filter((t) => t.facility === f.name);
                const totalPax = trips.reduce((s, t) => s + t.passengers, 0);
                return (
                  <div
                    key={f.id}
                    className="bg-white rounded-xl p-4 border border-gray-100"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-sm text-primary-dark">
                        {f.name}
                      </div>
                      {f.offersWeekdayVisits && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                          Weekday
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {trips.length} trip{trips.length !== 1 ? "s" : ""} &middot;{" "}
                      {totalPax} passenger{totalPax !== 1 ? "s" : ""} waiting
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      ~{f.driveTimeFromBuffalo} min from Buffalo
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trip list */}
          <h2 className="font-bold text-primary-dark text-lg mb-3">
            {shiftFilter === "all"
              ? "Available Trips"
              : shiftFilter === "weekday"
                ? "Weekday Shifts"
                : "Weekend Shifts"}
          </h2>
          <div className="space-y-4">
            {visibleTrips.map((trip) => {
              const isAccepted = accepted.has(trip.id);
              const netEarning = trip.totalDeposit * 0.9;
              const shift = getShiftType(trip.iso);
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
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-primary-dark">
                          {trip.facility}
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            shift === "weekday"
                              ? "bg-accent/20 text-accent"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {shift}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {trip.date}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                        <span className="text-gray-600">
                          👥 {trip.passengers} passengers
                        </span>
                        <span className="text-gray-600">
                          💰 ${trip.totalDeposit} pool
                        </span>
                        <span className="text-gray-600">
                          🚐 ~{trip.driveMinutes} min drive
                        </span>
                        <span className="font-semibold text-success">
                          You earn: ${netEarning.toFixed(0)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Accept by: {trip.deadline} &middot; 3-hour minimum
                        turnaround at facility
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
            {visibleTrips.length === 0 && (
              <p className="text-center text-gray-400 py-8 bg-white rounded-xl border border-gray-100">
                No {shiftFilter} shifts available right now. Check back soon.
              </p>
            )}
          </div>
        </>
      ) : (
        <VehicleRegistration />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 text-center border ${
        accent
          ? "bg-accent/10 border-accent/40"
          : "bg-white border-gray-100"
      }`}
    >
      <div
        className={`text-2xl font-bold ${
          accent ? "text-accent" : "text-primary-dark"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
        active
          ? "bg-primary text-white border-primary"
          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
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
