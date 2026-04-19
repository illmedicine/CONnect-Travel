/**
 * DIN (Departmental Identification Number) visiting-schedule logic.
 *
 * Different facilities use different rules to spread visitation evenly
 * across weekends. This module encodes those rules so the booking wizard
 * can auto-filter the calendar to valid dates.
 */

import type { VisitingRules } from "./facilities";

/** Returns true when a given date is a Saturday or Sunday. */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * For DIN-based odd/even rules (e.g. Collins):
 * – Saturday → even last-digit DIDs
 * – Sunday   → odd last-digit DIDs
 */
function isValidOddEven(din: string, date: Date): boolean {
  const lastDigit = parseInt(din.slice(-1), 10);
  if (isNaN(lastDigit)) return false;
  const isEven = lastDigit % 2 === 0;
  const isSaturday = date.getDay() === 6;
  return isEven ? isSaturday : !isSaturday; // even → Sat, odd → Sun
}

/**
 * For alternating-weekend rules (e.g. Wyoming, Orleans):
 * We use ISO week number to determine which "group" visits.
 * Even ISO weeks → even last-digit DIDs on both Sat & Sun
 * Odd ISO weeks  → odd last-digit DIDs on both Sat & Sun
 */
function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function isValidAlternatingWeekend(din: string, date: Date): boolean {
  const lastDigit = parseInt(din.slice(-1), 10);
  if (isNaN(lastDigit)) return false;
  const week = getISOWeek(date);
  const isEvenWeek = week % 2 === 0;
  const isEvenDIN = lastDigit % 2 === 0;
  return isEvenWeek === isEvenDIN;
}

/**
 * For last-name-letter rules (e.g. Albion):
 * A-M → Saturday, N-Z → Sunday
 */
function isValidLastNameLetter(lastName: string, date: Date): boolean {
  if (!lastName) return false;
  const firstLetter = lastName[0].toUpperCase();
  const isSaturday = date.getDay() === 6;
  const isAtoM = firstLetter >= "A" && firstLetter <= "M";
  return isAtoM ? isSaturday : !isSaturday;
}

/**
 * Master function: given visiting rules and inmate info, returns whether
 * a particular date is a valid visiting day.
 */
export function isValidVisitingDate(
  rules: VisitingRules,
  date: Date,
  din?: string,
  lastName?: string
): boolean {
  if (!isWeekend(date)) return false;

  switch (rules.type) {
    case "open":
      return true;

    case "din-odd-even":
      return din ? isValidOddEven(din, date) : true; // if no DIN yet, show all

    case "din-alternating-weekends":
    case "din-alternating-weekends-capped":
      return din ? isValidAlternatingWeekend(din, date) : true;

    case "last-name-letter":
      return lastName ? isValidLastNameLetter(lastName, date) : true;

    default:
      return true;
  }
}

/**
 * Returns the next N valid visiting dates for a facility, starting from
 * today.
 */
export function getNextVisitingDates(
  rules: VisitingRules,
  count: number,
  din?: string,
  lastName?: string
): Date[] {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Start from tomorrow
  cursor.setDate(cursor.getDate() + 1);

  while (dates.length < count) {
    if (isValidVisitingDate(rules, cursor, din, lastName)) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}
