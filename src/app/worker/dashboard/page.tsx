"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MiddletonLogo } from "@/components/MiddletonLogo";
import {
  formatUsd,
  monthlyRateUsd,
  sumMonthlyRevenue,
} from "@/lib/membershipPricing";
import type { MembershipRecord } from "@/lib/types";
import { brandPageShell, brandStaffHeaderBar } from "@/lib/siteChrome";
import {
  type DashboardTab,
  type DateRangePreset,
  filterDashboardRows,
} from "@/lib/workerDashboardFilters";

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

const TABS: { id: DashboardTab; label: string; hint: string }[] = [
  {
    id: "active",
    label: "Active",
    hint: "Current members. Date filters use signup date.",
  },
  {
    id: "cancelled",
    label: "Cancelled",
    hint: "Churned members. Date filters use cancellation date (legacy rows use last update).",
  },
  {
    id: "edited",
    label: "Edited",
    hint: "Sheets saved from staff edit. Date filters use last edit save.",
  },
];

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "—";
  return t.toLocaleString();
}

export default function WorkerDashboardPage() {
  const [rows, setRows] = useState<MembershipRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("today");
  const [tab, setTab] = useState<DashboardTab>("active");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/memberships", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error || "Could not load memberships");
        setRows([]);
        return;
      }
      setRows(data.memberships as MembershipRecord[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (rows ? filterDashboardRows(rows, tab, datePreset, search) : []),
    [rows, tab, datePreset, search]
  );

  const revenue = useMemo(() => sumMonthlyRevenue(filtered), [filtered]);

  const tabMeta = TABS.find((t) => t.id === tab)!;

  async function logout() {
    await fetch("/api/worker-auth", {
      method: "DELETE",
      credentials: "include",
    });
    window.location.href = "/worker/login";
  }

  return (
    <div className={brandPageShell}>
      <header className={brandStaffHeaderBar}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <MiddletonLogo size="sm" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                Staff
              </p>
              <h1 className="font-display text-xl font-bold text-zinc-50">
                Membership sheets
              </h1>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/signup"
              className="rounded-lg border border-zinc-600 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-100 backdrop-blur-sm transition hover:border-zinc-500 hover:bg-zinc-800/80"
            >
              Open public signup
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {error ? (
          <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {rows === null ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No signup sheets yet. Submissions will appear here.
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    tab === t.id
                      ? "bg-accent text-white shadow-md shadow-black/25"
                      : "bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="mb-6 text-sm text-zinc-500">{tabMeta.hint}</p>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Total monthly (shown)
                </p>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums text-zinc-50">
                  {formatUsd(revenue.totalUsd)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {filtered.length} row{filtered.length === 1 ? "" : "s"} · published
                  rates
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Individual
                </p>
                <p className="mt-2 font-display text-2xl font-bold tabular-nums text-zinc-50">
                  {formatUsd(revenue.individualUsd)}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {revenue.individualCount} × monthly rate
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/30">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Family
                </p>
                <p className="mt-2 font-display text-2xl font-bold tabular-nums text-zinc-50">
                  {formatUsd(revenue.familyUsd)}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {revenue.familyCount} × monthly rate
                </p>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDatePreset(p.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      datePreset === p.id
                        ? "bg-accent text-white shadow-md shadow-black/20"
                        : "border border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <label className="block min-w-[min(100%,280px)] flex-1 lg:max-w-md">
                <span className="sr-only">Search submissions</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, phone, ID…"
                  autoComplete="off"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-100 outline-none ring-accent/30 placeholder:text-zinc-500 focus:border-accent focus:ring-2"
                />
              </label>
            </div>

            {filtered.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-400">
                {tab === "edited"
                  ? "No edited sheets in this range. Edits are tracked when staff saves the membership form."
                  : "No submissions match your search or date filter."}
              </p>
            ) : (
              <div className="overflow-x-auto overflow-hidden rounded-2xl border border-zinc-800 bg-white shadow-xl shadow-black/20">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead className="border-b border-surface-border bg-surface-soft text-xs uppercase tracking-wide text-ink-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium text-right">Monthly</th>
                      <th className="px-4 py-3 font-medium">Primary</th>
                      <th className="px-4 py-3 font-medium">Signup</th>
                      <th className="px-4 py-3 font-medium">Cancelled</th>
                      <th className="px-4 py-3 font-medium">Last edit</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {filtered.map((m) => (
                      <tr key={m.membershipId} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-semibold tabular-nums text-ink">
                          {m.membershipId}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              m.status === "active"
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize text-ink-muted">
                          {m.type}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-ink">
                          {formatUsd(monthlyRateUsd(m.type))}
                        </td>
                        <td className="px-4 py-3 text-ink">{m.primary.fullName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                          {fmt(m.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                          {m.status === "cancelled" ? fmt(m.cancelledAt ?? m.updatedAt) : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                          {fmt(m.lastSheetEditAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/worker/membership/${m.membershipId}`}
                            className="font-medium text-accent hover:text-accent-hover"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
