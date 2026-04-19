"use client";

import { useState } from "react";
import type { BookingData } from "./booking-wizard";

interface Props {
  data: Partial<BookingData>;
  updateData: (d: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepInmate({ data, updateData, onNext, onBack }: Props) {
  const [lookupMode, setLookupMode] = useState<"name" | "din">("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { din: string; name: string; facility: string }[] | null
  >(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    // In production this calls NYS DOCCS Inmate Population Search API / scraper
    // For now, simulate a result after a delay
    await new Promise((r) => setTimeout(r, 800));
    setSearchResults([
      {
        din: "24B1234",
        name: searchQuery || "Sample Inmate",
        facility: "Wende Correctional Facility",
      },
    ]);
    setSearching(false);
  };

  const selectInmate = (result: {
    din: string;
    name: string;
    facility: string;
  }) => {
    const parts = result.name.split(" ");
    updateData({
      inmateDIN: result.din,
      inmateName: result.name,
      inmateLastName: parts[parts.length - 1] || "",
    });
  };

  const canProceed = data.inmateDIN && data.inmateName;

  return (
    <div>
      <h2 className="text-xl font-bold text-primary-dark mb-1">
        Step 2: Inmate Information
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Look up your loved one so we can show the correct visiting schedule.
      </p>

      {/* Toggle lookup mode */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setLookupMode("name")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            lookupMode === "name"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Search by Name
        </button>
        <button
          onClick={() => setLookupMode("din")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            lookupMode === "din"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Enter DIN Directly
        </button>
      </div>

      {lookupMode === "name" ? (
        <>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter inmate's full name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searching}
              className="bg-primary hover:bg-primary-light disabled:opacity-40 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          {searchResults && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                Results from NYS DOCCS
              </p>
              {searchResults.map((r) => (
                <button
                  key={r.din}
                  onClick={() => selectInmate(r)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    data.inmateDIN === r.din
                      ? "border-accent bg-accent/5"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="font-semibold text-primary-dark">
                    {r.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    DIN: {r.din} &middot; {r.facility}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DIN (Departmental Identification Number)
            </label>
            <input
              type="text"
              placeholder="e.g. 24B1234"
              value={data.inmateDIN || ""}
              onChange={(e) => updateData({ inmateDIN: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
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
                const parts = name.split(" ");
                updateData({
                  inmateName: name,
                  inmateLastName: parts[parts.length - 1] || "",
                });
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
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
          disabled={!canProceed}
          className="bg-accent hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed text-primary-dark font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
