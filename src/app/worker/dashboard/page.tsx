"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MiddletonLogo } from "@/components/MiddletonLogo";
import type { MembershipRecord } from "@/lib/types";
import { brandPageShell, brandStaffHeaderBar } from "@/lib/siteChrome";

export default function WorkerDashboardPage() {
  const [rows, setRows] = useState<MembershipRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-white shadow-xl shadow-black/20">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-border bg-surface-soft text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Primary</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {rows.map((m) => (
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
                    <td className="px-4 py-3 text-ink">{m.primary.fullName}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {new Date(m.createdAt).toLocaleString()}
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
      </div>
    </div>
  );
}
