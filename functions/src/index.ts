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

const PARSER_VERSION = "v9";

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
    // Wait specifically for the DIN label to appear (Blazor render complete).
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll("label,th,td,div,span")).some(
          (el) => /\bDIN:?\s*$/i.test((el.textContent || "").trim()),
        ),
      { timeout: 15_000 },
    );
    await new Promise((r) => setTimeout(r, 500));

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

    // Give Blazor a moment to process any pending state updates from typing.
    await new Promise((r) => setTimeout(r, 800));

    // Submit. Blazor forms reliably respond to Enter while focus is in the
    // form. Press Enter first; if that doesn't navigate, click Search.
    await page.keyboard.press("Enter");
    await new Promise((r) => setTimeout(r, 600));

    // If still on form (no SYSTEM ERROR / results / nav change), click button.
    const stillOnForm = await page.evaluate(() => {
      const t = document.body.innerText.toLowerCase();
      return (
        !t.includes("start a new search") &&
        !t.includes("system error") &&
        !t.includes("no offender") &&
        !t.includes("no results")
      );
    });
    if (stillOnForm) {
      const submitted = await page.evaluate(() => {
        const all = Array.from(
          document.querySelectorAll<HTMLElement>(
            'button, input[type="submit"], input[type="button"]',
          ),
        );
        const btn = all.find((b) => {
          const text =
            b.tagName === "INPUT"
              ? (b as HTMLInputElement).value
              : b.textContent || "";
          return /^\s*search\s*$/i.test(text);
        });
        if (btn) {
          (btn as HTMLElement).click();
          return true;
        }
        return false;
      });
      if (!submitted) {
        logger.warn("doccs: search button not found");
      }
    }

    // Wait for results: the DOCCS Blazor app replaces the form with results
    // in-place. The form's instructional text ("Use Last Name alone...") is
    // a reliable form-only marker. When it goes away, results have rendered.
    // We capture it before submit so we can detect its disappearance.
    const formMarker = "Use Last Name alone";
    await page.waitForFunction(
      (marker: string) => {
        const text = document.body.innerText;
        const stillOnForm = text.includes(marker);
        if (stillOnForm) {
          // Check for inline error states that DO appear while still on form.
          // SYSTEM ERROR shows below the form when DOCCS rejects the request.
          const errMatch = text.match(/SYSTEM ERROR[^\n]*/);
          if (errMatch) {
            // Make sure it's not just hidden template text — look for it
            // close to the top of body text (visible errors render near top).
            // If it's visible, the surrounding 200 chars won't include the
            // form's section labels "By DIN" etc.
            const idx = text.indexOf(errMatch[0]);
            const context = text.slice(Math.max(0, idx - 100), idx + 200);
            if (
              !context.includes("By DIN") &&
              !context.includes("By Name") &&
              !context.includes("By NYSID")
            ) {
              return true;
            }
          }
          // No-results message also appears in-place.
          if (/no offender|no results|no matches|not found/i.test(text)) {
            return true;
          }
          return false;
        }
        // Form gone → results rendered.
        return true;
      },
      { timeout: 25_000 },
      formMarker,
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
  // Find an input near the label text. The DOCCS form is a table layout where
  // a <td> holds the label "DIN:" and the next <td> holds the input.
  const handle = await page.evaluateHandle((hint) => {
    const lower = hint.toLowerCase();

    // 1. Try <label for="...">
    const labels = Array.from(document.querySelectorAll("label"));
    for (const lbl of labels) {
      const text = (lbl.textContent || "").toLowerCase().trim();
      if (!text.includes(lower)) continue;
      const forId = lbl.getAttribute("for");
      if (forId) {
        const byId = document.getElementById(forId);
        if (byId && (byId.tagName === "INPUT" || byId.tagName === "SELECT")) {
          return byId;
        }
      }
    }

    // 2. Look for any element whose text ends with the hint + ":" (e.g. "DIN:"),
    //    then find the nearest input. This catches the DOCCS table layout.
    const allEls = Array.from(
      document.querySelectorAll<HTMLElement>("td,th,label,div,span"),
    );
    const labelEls = allEls.filter((el) => {
      // Only direct text containers, not parents of huge trees.
      const ownText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => (n.textContent || "").trim())
        .join(" ");
      return new RegExp(`\\b${lower}\\b\\s*:?\\s*$`, "i").test(ownText);
    });

    for (const lblEl of labelEls) {
      // Try same parent
      const parent = lblEl.parentElement;
      if (parent) {
        const inputs = Array.from(
          parent.querySelectorAll<HTMLInputElement>("input,select"),
        );
        for (const inp of inputs) {
          if (inp.type !== "hidden" && inp.type !== "radio") return inp;
        }
      }
      // Try next sibling cell
      let sib = lblEl.nextElementSibling;
      while (sib) {
        const inp = sib.querySelector<HTMLInputElement>("input,select");
        if (inp && inp.type !== "hidden" && inp.type !== "radio") return inp;
        sib = sib.nextElementSibling;
      }
      // Try parent row's siblings
      const row = lblEl.closest("tr");
      if (row) {
        const inp = row.querySelector<HTMLInputElement>("input,select");
        if (inp && inp.type !== "hidden" && inp.type !== "radio") return inp;
      }
    }

    // 3. Fallback: any input whose attributes mention the hint.
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("input"),
    );
    return (
      inputs.find((el) => {
        if (el.type === "hidden" || el.type === "radio") return false;
        const attrs = [
          el.getAttribute("placeholder"),
          el.getAttribute("aria-label"),
          el.getAttribute("name"),
          el.getAttribute("id"),
          el.getAttribute("title"),
        ]
          .filter(Boolean)
          .map((s) => (s as string).toLowerCase());
        return attrs.some((a) => a.includes(lower));
      }) ?? null
    );
  }, labelHint);

  const el = handle.asElement() as
    | import("puppeteer-core").ElementHandle<HTMLInputElement>
    | null;
  if (!el) {
    logger.warn("doccs: input not found", { labelHint });
    return;
  }

  // Capture a stable selector for the input so we can re-query it after each
  // keystroke (Blazor often re-renders the DOM node, which detaches our
  // ElementHandle and silently drops subsequent typing).
  const selector = await el.evaluate((node) => {
    if (node.id) return `#${CSS.escape(node.id)}`;
    if (node.name) return `input[name="${CSS.escape(node.name)}"]`;
    const ph = node.getAttribute("placeholder");
    if (ph) return `input[placeholder="${ph.replace(/"/g, '\\"')}"]`;
    return "";
  });

  if (!selector) {
    logger.warn("doccs: could not derive selector for input", { labelHint });
    return;
  }

  // Clear any existing value.
  await page.evaluate((sel) => {
    const node = document.querySelector<HTMLInputElement>(sel);
    if (!node) return;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(node, "");
    node.dispatchEvent(new Event("input", { bubbles: true }));
  }, selector);

  // Click via selector (Puppeteer re-queries the DOM, immune to re-render).
  await page.click(selector);

  // Type one char at a time via page.type. Puppeteer's page.type re-queries
  // the selector before each key, so it survives Blazor re-renders.
  await page.type(selector, value, { delay: 80 });

  // Force-set the value via the prototype setter to guarantee the DOM node
  // (which Blazor reads from) has the full string, and dispatch input+change
  // so Blazor's @bind handlers fire. This is belt-and-suspenders for cases
  // where keystroke events were dropped during a re-render.
  await page.evaluate(
    (sel, v) => {
      const node = document.querySelector<HTMLInputElement>(sel);
      if (!node) return;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(node, v);
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
    },
    selector,
    value,
  );

  // Tab to commit (fires blur/change, which is the default Blazor @bind event).
  await page.keyboard.press("Tab");
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

    // Detect header row by structure or content.
    const theadCells = Array.from(t.querySelectorAll("thead th"));
    const firstRowThs = rows[0].querySelectorAll("th");
    const firstRowTds = rows[0].querySelectorAll("td");
    const firstRowAllCells = Array.from(rows[0].querySelectorAll("td,th"));

    // Content heuristic: first row's cells look like field labels?
    // - At least 3 cells AND
    // - >=60% of cells match a known field label (DIN, Name, Race/Ethnicity, etc.)
    //   OR end with ":"
    const KNOWN_LABEL_RE =
      /^(din|name|race|ethnicity|date of birth|sex|custody|housing|releasing|facility|county|received|admission|department|earliest release|parole|conditional|maximum|expiration)/i;
    const labelHits = firstRowAllCells.filter((c) => {
      const txt = (c.textContent || "").trim();
      if (!txt) return false;
      if (txt.endsWith(":")) return true;
      return KNOWN_LABEL_RE.test(txt);
    }).length;
    const looksLikeHeaderByContent =
      firstRowAllCells.length >= 3 &&
      labelHits / firstRowAllCells.length >= 0.6;

    const hasHeaderRow =
      theadCells.length > 0 ||
      (firstRowThs.length > 0 && firstRowTds.length === 0) ||
      looksLikeHeaderByContent;

    if (hasHeaderRow) {
      // Columnar table: one inmate per body row.
      const headerCells =
        theadCells.length > 0
          ? theadCells
          : firstRowAllCells;
      const headers = headerCells.map((c) =>
        (c.textContent || "").trim().replace(/:$/, ""),
      );

      const bodyRows =
        theadCells.length > 0
          ? Array.from(t.querySelectorAll("tbody tr"))
          : rows.slice(1);

      for (const tr of bodyRows) {
        const cells = Array.from(tr.querySelectorAll("td,th"));
        if (cells.length === 0) continue;
        // Skip rows that look like another header (defensive).
        const allEmpty = cells.every(
          (c) => !(c.textContent || "").trim(),
        );
        if (allEmpty) continue;
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

  // Detail page fallback: harvest all "Label: value" pairs from any element
  // (DOCCS detail page sometimes uses <strong>Label:</strong> value patterns).
  if (out.length === 0) {
    const raw: Record<string, string> = {};

    // Walk every block-level element looking for "Label: value" text patterns.
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        "tr,div,p,li,section,article",
      ),
    );
    for (const el of candidates) {
      // Only consider leaf-ish elements (no nested block descendants that
      // also match the pattern), to avoid capturing a labels-only block as
      // one big "Label: rest-of-labels" pair.
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!txt || txt.length > 200) continue;
      // Reject text that contains another label colon (catches concatenated
      // header rows like "DIN: Race/Ethnicity: Date of Birth:").
      if ((txt.match(/:/g) || []).length > 1) continue;
      const m = txt.match(/^([A-Za-z][A-Za-z /()\-]{1,40}):\s*(.+)$/);
      if (m) {
        const k = m[1].trim();
        const v = m[2].trim();
        if (v && !v.endsWith(":") && !raw[k]) raw[k] = v;
      }
    }

    // Try to capture the inmate name from the page heading if not in the map.
    if (!raw["Name"] && !raw["Inmate Name"]) {
      const h = document.querySelector("h1,h2,h3");
      const ht = (h?.textContent || "").trim();
      // Heuristic: "LAST, FIRST [M]" pattern.
      if (/^[A-Z][A-Z' \-]+,\s+[A-Z]/.test(ht)) {
        raw["Name"] = ht;
      }
    }

    const rec = buildRecord(raw);
    if (rec) out.push(rec);
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
