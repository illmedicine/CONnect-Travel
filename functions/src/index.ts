/**
 * DOCCS Incarcerated Lookup proxy.
 *
 * The official lookup at https://nysdoccslookup.doccs.ny.gov/ is a Blazor
 * WebAssembly SPA, so plain HTML scraping returns the empty shell. We use
 * a headless Chromium to render the page, fill the form, click search,
 * and parse the rendered results table.
 *
 * Results are cached in Firestore at /doccsCache/{queryHash} for 24 h to
 * minimize load on DOCCS and keep response times fast.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as crypto from "crypto";
import puppeteer, { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

initializeApp();
setGlobalOptions({ region: "us-east1", maxInstances: 5 });

const LOOKUP_URL = "https://nysdoccslookup.doccs.ny.gov/";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface SearchInput {
  din?: string;
  lastName?: string;
  firstName?: string;
  middleInitial?: string;
  suffix?: string;
  birthYear?: string;
}

interface InmateRecord {
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

interface SearchResult {
  query: SearchInput;
  inmates: InmateRecord[];
  message?: string;
  fetchedAtIso: string;
  cached: boolean;
}

function sanitize(input: SearchInput): SearchInput {
  const trim = (s?: string) => (s ? s.trim().slice(0, 60) : undefined);
  return {
    din: trim(input.din)?.toUpperCase(),
    lastName: trim(input.lastName),
    firstName: trim(input.firstName),
    middleInitial: trim(input.middleInitial)?.slice(0, 1),
    suffix: trim(input.suffix),
    birthYear: trim(input.birthYear),
  };
}

function hashQuery(q: SearchInput): string {
  const canonical = JSON.stringify(q, Object.keys(q).sort());
  return crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

let _browser: Browser | null = null;
async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.connected) return _browser;
  _browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
  });
  return _browser;
}

async function performSearch(q: SearchInput): Promise<SearchResult> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    );
    await page.goto(LOOKUP_URL, { waitUntil: "networkidle2", timeout: 30_000 });

    // Wait for the Blazor app to render the search form.
    await page.waitForSelector('input[id*="DIN" i], input[name*="din" i], #DIN', {
      timeout: 25_000,
    });

    if (q.din) {
      await page.evaluate((value) => {
        const el = document.querySelector<HTMLInputElement>(
          'input[id*="DIN" i], input[name*="din" i], #DIN',
        );
        if (el) {
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, q.din);
    } else if (q.lastName) {
      await typeFieldByLabel(page, "Last", q.lastName);
      if (q.firstName) await typeFieldByLabel(page, "First", q.firstName);
      if (q.middleInitial) await typeFieldByLabel(page, "MI", q.middleInitial);
      if (q.suffix) await typeFieldByLabel(page, "Suffix", q.suffix);
      if (q.birthYear) await typeFieldByLabel(page, "Birth", q.birthYear);
    } else {
      throw new HttpsError(
        "invalid-argument",
        "Provide either a DIN or a last name.",
      );
    }

    // Click Search.
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(
        (b) => /^\s*search\s*$/i.test(b.textContent || ""),
      );
      btn?.click();
    });

    // Wait for results table OR a "no results" message.
    await page.waitForFunction(
      () => {
        const text = document.body.innerText.toLowerCase();
        return (
          document.querySelector("table") ||
          text.includes("no offender") ||
          text.includes("no results") ||
          text.includes("no matches") ||
          text.includes("not found")
        );
      },
      { timeout: 25_000 },
    );

    // Allow render to settle.
    await new Promise((r) => setTimeout(r, 500));

    const inmates = await page.evaluate(extractInmateRecordsInBrowser);
    const message =
      inmates.length === 0
        ? (await page.evaluate(() => {
            const text = document.body.innerText;
            const match = text.match(
              /(no offender[^.\n]*|no results[^.\n]*|no matches[^.\n]*|not found[^.\n]*)/i,
            );
            return match ? match[0].trim() : "No records returned.";
          }))
        : undefined;

    return {
      query: q,
      inmates,
      message,
      fetchedAtIso: new Date().toISOString(),
      cached: false,
    };
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function typeFieldByLabel(
  page: import("puppeteer-core").Page,
  labelHint: string,
  value: string,
): Promise<void> {
  const handle = await page.evaluateHandle((hint) => {
    const labels = Array.from(document.querySelectorAll("label"));
    const lbl = labels.find((l) =>
      (l.textContent || "").toLowerCase().includes(hint.toLowerCase()),
    );
    if (!lbl) return null;
    const forId = lbl.getAttribute("for");
    if (forId) {
      const byId = document.getElementById(forId);
      if (byId) return byId;
    }
    return lbl.parentElement?.querySelector("input") ?? null;
  }, labelHint);
  const el = handle.asElement();
  if (!el) return;
  await el.evaluate((node, v) => {
    const input = node as HTMLInputElement;
    input.value = v;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

/** Runs inside the browser context. */
function extractInmateRecordsInBrowser(): InmateRecord[] {
  const out: InmateRecord[] = [];

  // The DOCCS results page renders one or more detail panels with
  // <dt>/<dd>-style label/value rows OR a table with two columns.
  // We try a few strategies.

  const collectFromTable = (table: HTMLTableElement) => {
    const raw: Record<string, string> = {};
    table.querySelectorAll("tr").forEach((tr) => {
      const cells = tr.querySelectorAll("td,th");
      if (cells.length >= 2) {
        const k = (cells[0].textContent || "").trim().replace(/:$/, "");
        const v = (cells[1].textContent || "").trim();
        if (k && v) raw[k] = v;
      }
    });
    return raw;
  };

  const tables = Array.from(document.querySelectorAll("table"));
  for (const t of tables) {
    const raw = collectFromTable(t as HTMLTableElement);
    if (Object.keys(raw).length === 0) continue;
    const r: InmateRecord = {
      din: pick(raw, ["DIN", "Department ID Number", "Department Identification Number"]) || "",
      name: pick(raw, ["Inmate Name", "Name"]) || "",
      sex: pick(raw, ["Sex"]),
      dateOfBirth: pick(raw, ["Date of Birth", "DOB"]),
      race: pick(raw, ["Race / Ethnicity", "Race/Ethnicity", "Race"]),
      custodyStatus: pick(raw, ["Custody Status", "Status"]),
      housingFacility: pick(raw, [
        "Housing / Releasing Facility",
        "Housing Facility",
        "Housing/Releasing Facility",
        "Facility",
      ]),
      dateReceived: pick(raw, ["Date Received (Original)", "Date Received"]),
      earliestReleaseDate: pick(raw, [
        "Earliest Release Date",
        "Earliest Release",
      ]),
      paroleHearingDate: pick(raw, ["Parole Hearing Date", "Parole Hearing"]),
      paroleEligibilityDate: pick(raw, ["Parole Eligibility Date"]),
      conditionalReleaseDate: pick(raw, ["Conditional Release Date"]),
      maxExpirationDate: pick(raw, [
        "Maximum Expiration Date",
        "Max Expiration Date",
      ]),
      raw,
    };
    if (r.din || r.name) out.push(r);
  }
  return out;

  function pick(map: Record<string, string>, keys: string[]): string | undefined {
    for (const k of keys) {
      if (map[k]) return map[k];
      const ci = Object.keys(map).find(
        (mk) => mk.toLowerCase() === k.toLowerCase(),
      );
      if (ci) return map[ci];
    }
    return undefined;
  }
}

export const searchDoccs = onCall(
  {
    timeoutSeconds: 60,
    memory: "1GiB",
    cpu: 1,
    minInstances: 0,
    concurrency: 1,
  },
  async (req) => {
    if (!req.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Sign in to look up DOCCS records.",
      );
    }
    const q = sanitize((req.data ?? {}) as SearchInput);
    if (!q.din && !q.lastName) {
      throw new HttpsError(
        "invalid-argument",
        "Provide either a DIN or at least a last name.",
      );
    }

    const db = getFirestore();
    const cacheId = hashQuery(q);
    const cacheRef = db.collection("doccsCache").doc(cacheId);

    const cached = await cacheRef.get();
    if (cached.exists) {
      const data = cached.data() as SearchResult & { fetchedAtMs: number };
      if (Date.now() - data.fetchedAtMs < CACHE_TTL_MS) {
        return { ...data, cached: true };
      }
    }

    const result = await performSearch(q);

    await cacheRef.set({
      ...result,
      fetchedAtMs: Date.now(),
      writtenAt: FieldValue.serverTimestamp(),
    });

    return result;
  },
);
