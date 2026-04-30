"use client";

import { useState } from "react";
import type { BookingData } from "./booking-wizard";
import { facilities } from "@/data/facilities";
import {
  searchDoccs,
  type DoccsInmateRecord,
  type DoccsSearchInput,
} from "@/lib/doccs";
import { onIdentityChange } from "@/lib/driver-auth";
import { useEffect } from "react";

interface Props {
  data: Partial<BookingData>;
  updateData: (d: Partial<BookingData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

const DIN_PATTERN = /^\d{2}[A-Z]\d{4}$/;

type Mode = "din" | "name" | "browse";

export function StepInmate({ data, updateData, onNext, onBack }: Props) {
  const [mode, setMode] = useState<Mode>("din");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<DoccsInmateRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cacheNote, setCacheNote] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  // DIN form
  const [dinInput, setDinInput] = useState(data.inmateDIN || "");

  // Name form
  const [lastName, setLastName] = useState(data.inmateLastName || "");
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [suffix, setSuffix] = useState("");
  const [birthYear, setBirthYear] = useState("");

  useEffect(
    () =>
      onIdentityChange((id) => {
        setSignedIn(!!id);
      }),
    [],
  );

  const dinValid = !dinInput || DIN_PATTERN.test(dinInput.toUpperCase());

  const runSearch = async () => {
    setError(null);
    setCacheNote(null);
    setResults(null);

    let payload: DoccsSearchInput;
    if (mode === "din") {
      const din = dinInput.toUpperCase();
      if (!DIN_PATTERN.test(din)) {
        setError("Enter a valid DIN like 24B1234.");
        return;
      }
      payload = { din };
    } else {
      if (!lastName.trim()) {
        setError("Last name is required.");
        return;
      }
      payload = {
        lastName: lastName.trim(),
        firstName: firstName.trim() || undefined,
        middleInitial: middleInitial.trim() || undefined,
        suffix: suffix.trim() || undefined,
        birthYear: birthYear.trim() || undefined,
      };
    }

    setSearching(true);
    try {
      const res = await searchDoccs(payload);
      setResults(res.inmates);
      if (res.cached) {
        setCacheNote(
          `Cached result from ${new Date(res.fetchedAtIso).toLocaleString()}.`,
        );
      }
      if (res.inmates.length === 0 && res.message) {
        setError(
          res.debugSnippet
            ? `${res.message}\n\nDiagnostic: ${res.debugSnippet}`
            : res.message,
        );
      }
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "functions/unauthenticated") {
        setError("Please sign in first to use the DOCCS lookup.");
      } else {
        setError(
          (e as { message?: string }).message ||
            "DOCCS lookup failed. Try again.",
        );
      }
    } finally {
      setSearching(false);
    }
  };

  const matchFacility = (housing?: string): string | undefined => {
    if (!housing) return undefined;
    const norm = housing.toLowerCase();
    return facilities.find((f) => norm.includes(f.name.toLowerCase().split(" ")[0]))
      ?.id;
  };

  const selectInmate = (r: DoccsInmateRecord) => {
    const facId = matchFacility(r.housingFacility);
    const parts = r.name.split(/[\s,]+/).filter(Boolean);
    updateData({
      inmateDIN: r.din,
      inmateName: r.name,
      inmateLastName: parts[0] || "",
      ...(facId ? { facilityId: facId } : {}),
    });
  };

  const canProceed =
    !!data.inmateDIN &&
    DIN_PATTERN.test(data.inmateDIN.toUpperCase()) &&
    (data.inmateName || "").trim().length >= 2;

  return (
    <div>
      <h2 className="text-xl font-bold text-primary-dark mb-1">
        Step 1: Inmate Information
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Search the official New York State DOCCS roster by DIN or last name.
      </p>

      {signedIn === false && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          You need to sign in before searching DOCCS.{" "}
          <a href="/login" className="font-semibold underline">
            Sign in →
          </a>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("din")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "din"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          By DIN
        </button>
        <button
          onClick={() => setMode("name")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "name"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          By Name
        </button>
        <button
          onClick={() => setMode("browse")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "browse"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Browse DOCCS ↗
        </button>
      </div>

      {mode === "din" ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="e.g. 24B1234"
            maxLength={7}
            value={dinInput}
            onChange={(e) => setDinInput(e.target.value.toUpperCase())}
            className={`w-full border rounded-xl px-4 py-3 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 ${
              dinValid
                ? "border-gray-200 focus:ring-accent"
                : "border-red-300 focus:ring-red-300"
            }`}
          />
          <p className="text-xs text-gray-500">
            Format: 2-digit year + letter + 4 digits.
          </p>
        </div>
      ) : mode === "name" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">First</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">M.I.</label>
            <input
              value={middleInitial}
              maxLength={1}
              onChange={(e) => setMiddleInitial(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Suffix</label>
            <input
              value={suffix}
              placeholder="Jr, Sr, III…"
              onChange={(e) => setSuffix(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Birth Year</label>
            <input
              value={birthYear}
              maxLength={4}
              placeholder="1985"
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      ) : (
        // Browse DOCCS mode — open live site in new tab, paste DIN back.
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
            <p className="text-sm text-gray-700 leading-relaxed">
              The official NYS DOCCS lookup blocks direct embedding for security
              reasons. Open it in a new tab, find the person you&apos;re visiting,
              then copy their <strong>DIN</strong> back here.
            </p>
            <a
              href="https://nysdoccslookup.doccs.ny.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Open DOCCS Lookup
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <path d="M14 3h7v7" />
                <path d="M10 14L21 3" />
                <path d="M21 14v7H3V3h7" />
              </svg>
            </a>
            <ol className="mt-4 text-xs text-gray-600 list-decimal list-inside space-y-1">
              <li>Search by name on the DOCCS site.</li>
              <li>
                Click the inmate row and copy the <strong>DIN</strong> (e.g.
                <span className="font-mono"> 21A1153</span>).
              </li>
              <li>Paste it below and we&apos;ll fetch their facility & details.</li>
            </ol>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1 font-semibold uppercase tracking-wider">
              Paste DIN here
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 21A1153"
                maxLength={7}
                value={dinInput}
                onChange={(e) => setDinInput(e.target.value.toUpperCase())}
                className={`flex-1 border rounded-xl px-4 py-3 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 ${
                  dinValid
                    ? "border-gray-200 focus:ring-accent"
                    : "border-red-300 focus:ring-red-300"
                }`}
              />
              <button
                onClick={() => {
                  setMode("din");
                  // run search after switching mode
                  setTimeout(runSearch, 0);
                }}
                disabled={!DIN_PATTERN.test(dinInput.toUpperCase()) || searching}
                className="bg-accent hover:bg-accent/90 disabled:opacity-40 text-white font-semibold px-5 rounded-xl text-sm transition-colors"
              >
                Look Up
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              We&apos;ll cross-reference DOCCS to fill facility, custody status,
              and visiting info automatically.
            </p>
          </div>
        </div>
      )}

      {mode !== "browse" && (
        <button
          onClick={runSearch}
          disabled={searching || signedIn === false}
          className="mt-4 bg-primary hover:bg-primary-light disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm w-full sm:w-auto"
        >
          {searching ? "Searching DOCCS…" : "Search DOCCS"}
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 whitespace-pre-wrap break-words">
          {error}
        </p>
      )}

      {cacheNote && (
        <p className="mt-2 text-xs text-gray-500">{cacheNote}</p>
      )}

      {results && results.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
            Results from NYS DOCCS
          </p>
          {results.map((r) => {
            const isSelected = data.inmateDIN === r.din;
            return (
              <button
                key={r.din}
                onClick={() => selectInmate(r)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  isSelected
                    ? "border-accent bg-accent/5"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-semibold text-primary-dark">
                      {r.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      DIN: <span className="font-mono">{r.din}</span>
                      {r.dateOfBirth && <> · DOB {r.dateOfBirth}</>}
                    </div>
                    {r.housingFacility && (
                      <div className="text-sm text-gray-700 mt-1">
                        🏛️ {r.housingFacility}
                      </div>
                    )}
                    {r.custodyStatus && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {r.custodyStatus}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-xs font-semibold text-accent shrink-0">
                      ✓ Selected
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {data.inmateDIN && (
        <div className="mt-6 rounded-xl border border-gray-100 bg-surface p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
            Selected
          </p>
          <p className="font-semibold text-primary-dark mt-1">
            {data.inmateName}
          </p>
          <p className="text-sm text-gray-600">
            DIN <span className="font-mono">{data.inmateDIN}</span>
            {data.facilityId && (
              <>
                {" "}
                ·{" "}
                {facilities.find((f) => f.id === data.facilityId)?.name ||
                  "Facility"}
              </>
            )}
          </p>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 font-medium px-6 py-3 transition-colors"
          >
            ← Back
          </button>
        ) : <div />}
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
