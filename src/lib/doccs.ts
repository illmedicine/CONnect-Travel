"use client";

import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirebaseApp } from "@/lib/firebase";

export interface DoccsInmateRecord {
  din: string;
  name: string;
  sex?: string;
  dateOfBirth?: string;
  race?: string;
  custodyStatus?: string;
  housingFacility?: string;
  dateReceived?: string;
  earliestReleaseDate?: string;
  paroleHearingDate?: string;
  paroleEligibilityDate?: string;
  conditionalReleaseDate?: string;
  maxExpirationDate?: string;
  raw: Record<string, string>;
}

export interface DoccsSearchInput {
  din?: string;
  lastName?: string;
  firstName?: string;
  middleInitial?: string;
  suffix?: string;
  birthYear?: string;
}

export interface DoccsSearchResult {
  query: DoccsSearchInput;
  inmates: DoccsInmateRecord[];
  message?: string;
  debugSnippet?: string;
  fetchedAtIso: string;
  cached: boolean;
}

export async function searchDoccs(
  input: DoccsSearchInput,
): Promise<DoccsSearchResult> {
  const fn = httpsCallable<DoccsSearchInput, DoccsSearchResult>(
    getFunctions(getFirebaseApp(), "us-east1"),
    "searchDoccs",
  );
  const res = await fn(input);
  return res.data;
}
