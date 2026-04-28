import type { MembershipRecord } from "@/lib/types";

export type DateRangePreset = "all" | "today" | "week" | "month";

/** Active = current members; Cancelled = churn; Edited = staff saved the sheet. */
export type DashboardTab = "active" | "cancelled" | "edited";

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Monday 00:00:00 of the week containing `d` (local). */
function startOfIsoWeekMonday(d: Date): Date {
  const x = startOfLocalDay(d);
  const dow = x.getDay(); // 0 Sun .. 6 Sat
  const offset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + offset);
  return x;
}

function endOfIsoWeekSunday(d: Date): Date {
  const start = startOfIsoWeekMonday(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return endOfLocalDay(end);
}

function startOfLocalMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfLocalMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** True if the given ISO timestamp falls in the preset window (local calendar). */
export function eventTimeInPreset(iso: string, preset: DateRangePreset): boolean {
  if (preset === "all") return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const now = new Date();

  if (preset === "today") {
    const a = startOfLocalDay(now).getTime();
    const b = endOfLocalDay(now).getTime();
    return t >= a && t <= b;
  }
  if (preset === "week") {
    const a = startOfIsoWeekMonday(now).getTime();
    const b = endOfIsoWeekSunday(now).getTime();
    return t >= a && t <= b;
  }
  /* month */
  const a = startOfLocalMonth(now).getTime();
  const b = endOfLocalMonth(now).getTime();
  return t >= a && t <= b;
}

/** When cancellation happened (explicit field, else last update as legacy fallback). */
export function cancelledEventIso(m: MembershipRecord): string {
  return m.cancelledAt ?? m.updatedAt;
}

export function rowMatchesTab(m: MembershipRecord, tab: DashboardTab): boolean {
  if (tab === "active") return m.status === "active";
  if (tab === "cancelled") return m.status === "cancelled";
  return Boolean(m.lastSheetEditAt?.trim());
}

/** Date used for time-range filter depends on tab (signup vs cancel vs edit). */
export function tabDateIso(m: MembershipRecord, tab: DashboardTab): string | null {
  if (tab === "active") return m.createdAt;
  if (tab === "cancelled") return cancelledEventIso(m);
  return m.lastSheetEditAt?.trim() ? m.lastSheetEditAt : null;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Case-insensitive: every whitespace-separated token must appear somewhere. */
export function submissionMatchesQuery(m: MembershipRecord, q: string): boolean {
  const n = norm(q);
  const tokens = n.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [
    String(m.membershipId),
    m.primary.fullName,
    m.primary.email,
    m.primary.phone,
    m.primary.address,
    m.spouse?.fullName ?? "",
    m.printedName,
    m.notes,
    m.ownerNotes,
  ]
    .join(" \n ")
    .toLowerCase();
  return tokens.every((tok) => haystack.includes(tok));
}

export function filterDashboardRows(
  rows: MembershipRecord[],
  tab: DashboardTab,
  preset: DateRangePreset,
  query: string
): MembershipRecord[] {
  return rows.filter((m) => {
    if (!rowMatchesTab(m, tab)) return false;
    const d = tabDateIso(m, tab);
    if (!d) return false;
    if (!eventTimeInPreset(d, preset)) return false;
    return submissionMatchesQuery(m, query);
  });
}

