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
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as crypto from "crypto";
import puppeteer, { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

initializeApp();
setGlobalOptions({ region: "us-east1", maxInstances: 5 });

let _firestoreSettingsApplied = false;
function db() {
  const d = getFirestore();
  if (!_firestoreSettingsApplied) {
    d.settings({ ignoreUndefinedProperties: true });
    _firestoreSettingsApplied = true;
  }
  return d;
}

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
  debugSnippet?: string;
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

const PARSER_VERSION = "v5";

function hashQuery(q: SearchInput): string {
  const canonical = JSON.stringify({ ...q, _v: PARSER_VERSION }, Object.keys(q).sort().concat("_v"));
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
    await page.waitForSelector("input", { timeout: 25_000 });
    // Give Blazor's component tree a beat to settle.
    await new Promise((r) => setTimeout(r, 800));

    // Select the correct search mode radio (By DIN / By Name).
    // The form has radio buttons that gate which input set is enabled.
    await page.evaluate((mode) => {
      const radios = Array.from(
        document.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
      );
      const target = radios.find((r) => {
        // Find the label associated with this radio.
        let labelText = "";
        if (r.id) {
          const lbl = document.querySelector(`label[for="${r.id}"]`);
          if (lbl) labelText = (lbl.textContent || "").toLowerCase();
        }
        if (!labelText && r.parentElement) {
          labelText = (r.parentElement.textContent || "").toLowerCase();
        }
        return labelText.includes(mode);
      });
      if (target && !target.checked) {
        target.click();
        target.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, q.din ? "din" : "name");
    // Let the form re-render after radio change.
    await new Promise((r) => setTimeout(r, 400));

    if (q.din) {
      await typeFieldByLabel(page, "DIN", q.din);
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

    // Verify at least one input has a value matching what we typed.
    const formState = await page.evaluate(() => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>("input"),
      );
      return inputs
        .filter((i) => i.type !== "radio" && i.type !== "submit" && i.value)
        .map((i) => ({
          id: i.id,
          name: i.name,
          placeholder: i.placeholder,
          value: i.value,
        }));
    });
    logger.info("doccs form state before submit", { query: q, formState });

    // Click Search. Capture the search button so we can also try keyboard-Enter.
    const submitted = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
        (b) => /^\s*search\s*$/i.test(b.textContent || ""),
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!submitted) {
      // Fallback: press Enter in the active input.
      await page.keyboard.press("Enter");
    }

    // Wait for results-specific markers (NOT just "any table" — the search
    // form itself is laid out with tables, so that check matches immediately).
    // DOCCS results page reliably contains a "Start a New Search" link and
    // a header cell with DIN text.
    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        const lower = text.toLowerCase();
        if (
          lower.includes("no offender") ||
          lower.includes("no results") ||
          lower.includes("no matches") ||
          lower.includes("not found") ||
          lower.includes("system error")
        ) {
          return true;
        }
        // Results page marker
        if (/start a new search/i.test(text)) return true;
        // Result rows: a header cell labeled DIN with body rows
        const ths = Array.from(document.querySelectorAll("th"));
        const hasDinHeader = ths.some((th) =>
          /^\s*din\s*$/i.test(th.textContent || ""),
        );
        if (hasDinHeader) {
          const cells = Array.from(document.querySelectorAll("td"));
          return cells.some((td) =>
            /^\s*\d{2}[A-Z]\d{4}\s*$/.test(td.textContent || ""),
          );
        }
        // Detail page
        if (/department id number/i.test(text)) {
          return /\d{2}[A-Z]\d{4}/.test(text);
        }
        return false;
      },
      { timeout: 25_000 },
    );

    // Allow render to settle.
    await new Promise((r) => setTimeout(r, 600));

    const inmates = await page.evaluate(extractInmateRecordsInBrowser);
    let message: string | undefined;
    let debugSnippet: string | undefined;
    if (inmates.length === 0) {
      const debug = await page.evaluate(() => {
        const text = document.body.innerText;
        const match = text.match(
          /(no offender[^.\n]*|no results[^.\n]*|no matches[^.\n]*|not found[^.\n]*)/i,
        );
        return {
          msg: match ? match[0].trim() : null,
          // First 800 chars of visible text + table count, for debugging.
          snippet: text.slice(0, 800),
          tableCount: document.querySelectorAll("table").length,
          url: location.href,
        };
      });
      message = debug.msg ?? "No records returned.";
      debugSnippet = `tables=${debug.tableCount} url=${debug.url} text="${debug.snippet.replace(/\s+/g, " ").slice(0, 400)}"`;
      logger.info("doccs empty result", { query: q, debug });
    }

    return {
      query: q,
      inmates,
      message,
      debugSnippet,
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
  // Resolve the input element via its <label> association OR via
  // placeholder/aria-label/name fallback. The DOCCS form lays labels and
  // inputs in adjacent <td> cells, so we walk up to the row and search
  // sibling cells too.
  const handle = await page.evaluateHandle((hint) => {
    const lower = hint.toLowerCase();

    // Strategy 1: label by text → for=id
    const labels = Array.from(document.querySelectorAll("label"));
    const lbl = labels.find((l) =>
      (l.textContent || "").toLowerCase().includes(lower),
    );
    if (lbl) {
      const forId = lbl.getAttribute("for");
      if (forId) {
        const byId = document.getElementById(forId);
        if (byId && (byId.tagName === "INPUT" || byId.tagName === "SELECT")) {
          return byId;
        }
      }
      // Look in the same <td>, then siblings of that <td>, then closest <tr>.
      const cell = lbl.closest("td,th,div,fieldset");
      const inSame = cell?.querySelector("input,select");
      if (inSame) return inSame;
      const row = lbl.closest("tr");
      if (row) {
        const inRow = row.querySelector("input,select");
        if (inRow) return inRow;
      }
      // Walk forward through following siblings of cell.
      let sib = cell?.nextElementSibling;
      while (sib) {
        const found = sib.querySelector("input,select");
        if (found) return found;
        sib = sib.nextElementSibling;
      }
    }

    // Strategy 2: placeholder / aria-label / name / id / preceding label text
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        "input,select",
      ),
    );
    return (
      inputs.find((el) => {
        const attrs = [
          el.getAttribute("placeholder"),
          el.getAttribute("aria-label"),
          el.getAttribute("name"),
          el.getAttribute("id"),
          el.getAttribute("title"),
        ]
          .filter(Boolean)
          .map((s) => (s as string).toLowerCase());
        if (attrs.some((a) => a.includes(lower))) return true;
        // Also check preceding text in the row.
        const row = el.closest("tr");
        if (row) {
          const rowText = (row.textContent || "").toLowerCase();
          if (rowText.includes(lower)) return true;
        }
        return false;
      }) ?? null
    );
  }, labelHint);

  const el = handle.asElement();
  if (!el) return;

  // Click to focus (Blazor wires events on the focused element).
  await el.evaluate((node) => {
    const input = node as HTMLInputElement;
    input.focus();
    // Clear via select-all + delete keystrokes so binding fires.
  });
  await (el as import("puppeteer-core").ElementHandle<Element>)
    .click({ clickCount: 3 })
    .catch(() => undefined);
  await page.keyboard.press("Backspace");

  // Type with a small delay to mimic human keystrokes (Blazor binds on input event).
  await page.keyboard.type(value, { delay: 30 });

  // Verify the value actually stuck. If not, fall back to direct DOM set + dispatch.
  const stuck = await el.evaluate(
    (node, expected) => (node as HTMLInputElement).value === expected,
    value,
  );
  if (!stuck) {
    await el.evaluate((node, v) => {
      const input = node as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(input, v);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  }

  // Fire change + blur so Blazor's @onchange commits the value.
  await el.evaluate((node) => {
    node.dispatchEvent(new Event("change", { bubbles: true }));
    (node as HTMLInputElement).blur();
  });
}

/** Runs inside the browser context. */
function extractInmateRecordsInBrowser(): InmateRecord[] {
  const out: InmateRecord[] = [];

  function pick(map: Record<string, string>, keys: readonly string[]): string | undefined {
    for (const k of keys) {
      const ci = Object.keys(map).find(
        (mk) => mk.toLowerCase() === k.toLowerCase(),
      );
      if (ci && map[ci]) return map[ci];
    }
    // Fuzzy: any key that includes the hint
    for (const k of keys) {
      const fuzzy = Object.keys(map).find((mk) =>
        mk.toLowerCase().includes(k.toLowerCase()),
      );
      if (fuzzy && map[fuzzy]) return map[fuzzy];
    }
    return undefined;
  }

  const FIELD_ALIASES = {
    din: ["DIN", "Department ID Number", "Department Identification Number"],
    name: ["Inmate Name", "Name"],
    sex: ["Sex"],
    dateOfBirth: ["Date of Birth", "DOB", "Birth Date"],
    race: ["Race / Ethnicity", "Race/Ethnicity", "Race"],
    custodyStatus: ["Custody Status", "Status"],
    housingFacility: [
      "Housing / Releasing Facility",
      "Housing Facility",
      "Housing/Releasing Facility",
      "Releasing Facility",
      "Facility",
    ],
    dateReceived: ["Date Received (Original)", "Date Received"],
    earliestReleaseDate: ["Earliest Release Date", "Earliest Release"],
    paroleHearingDate: ["Parole Hearing Date", "Parole Hearing"],
    paroleEligibilityDate: ["Parole Eligibility Date"],
    conditionalReleaseDate: ["Conditional Release Date"],
    maxExpirationDate: ["Maximum Expiration Date", "Max Expiration Date"],
  } as const;

  function buildRecord(raw: Record<string, string>): InmateRecord | null {
    const din = pick(raw, FIELD_ALIASES.din) || "";
    const name = pick(raw, FIELD_ALIASES.name) || "";
    if (!din && !name) return null;
    return {
      din,
      name,
      sex: pick(raw, FIELD_ALIASES.sex),
      dateOfBirth: pick(raw, FIELD_ALIASES.dateOfBirth),
      race: pick(raw, FIELD_ALIASES.race),
      custodyStatus: pick(raw, FIELD_ALIASES.custodyStatus),
      housingFacility: pick(raw, FIELD_ALIASES.housingFacility),
      dateReceived: pick(raw, FIELD_ALIASES.dateReceived),
      earliestReleaseDate: pick(raw, FIELD_ALIASES.earliestReleaseDate),
      paroleHearingDate: pick(raw, FIELD_ALIASES.paroleHearingDate),
      paroleEligibilityDate: pick(raw, FIELD_ALIASES.paroleEligibilityDate),
      conditionalReleaseDate: pick(raw, FIELD_ALIASES.conditionalReleaseDate),
      maxExpirationDate: pick(raw, FIELD_ALIASES.maxExpirationDate),
      raw,
    };
  }

  const tables = Array.from(document.querySelectorAll("table"));
  for (const t of tables) {
    const rows = Array.from(t.querySelectorAll("tr"));
    if (rows.length === 0) continue;

    // Detect header row: <thead> present OR first row contains only <th>
    const theadCells = Array.from(t.querySelectorAll("thead th"));
    const firstRowThs = rows[0].querySelectorAll("th");
    const firstRowTds = rows[0].querySelectorAll("td");
    const hasHeaderRow =
      theadCells.length > 0 ||
      (firstRowThs.length > 0 && firstRowTds.length === 0);

    if (hasHeaderRow) {
      // Columnar table: one inmate per body row.
      const headers = (
        theadCells.length > 0 ? theadCells : Array.from(firstRowThs)
      ).map((c) => (c.textContent || "").trim().replace(/:$/, ""));

      const bodyRows =
        theadCells.length > 0
          ? Array.from(t.querySelectorAll("tbody tr"))
          : rows.slice(1);

      for (const tr of bodyRows) {
        const cells = Array.from(tr.querySelectorAll("td,th"));
        if (cells.length === 0) continue;
        const raw: Record<string, string> = {};
        cells.forEach((c, i) => {
          const k = headers[i];
          const v = (c.textContent || "").trim();
          if (k && v) raw[k] = v;
        });
        const rec = buildRecord(raw);
        if (rec) out.push(rec);
      }
    } else {
      // Key/value table: each row has label cell + value cell(s).
      const raw: Record<string, string> = {};
      rows.forEach((tr) => {
        const cells = tr.querySelectorAll("td,th");
        if (cells.length >= 2) {
          const k = (cells[0].textContent || "").trim().replace(/:$/, "");
          const v = (cells[1].textContent || "").trim();
          if (k && v) raw[k] = v;
        }
      });
      const rec = buildRecord(raw);
      if (rec) out.push(rec);
    }
  }

  // Fallback: <dl> definition lists.
  if (out.length === 0) {
    document.querySelectorAll("dl").forEach((dl) => {
      const raw: Record<string, string> = {};
      const dts = dl.querySelectorAll("dt");
      const dds = dl.querySelectorAll("dd");
      const n = Math.min(dts.length, dds.length);
      for (let i = 0; i < n; i++) {
        const k = (dts[i].textContent || "").trim().replace(/:$/, "");
        const v = (dds[i].textContent || "").trim();
        if (k && v) raw[k] = v;
      }
      const rec = buildRecord(raw);
      if (rec) out.push(rec);
    });
  }

  // De-duplicate by DIN.
  const seen = new Set<string>();
  return out.filter((r) => {
    const key = r.din || r.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

    const cacheId = hashQuery(q);
    const cacheRef = db().collection("doccsCache").doc(cacheId);

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
