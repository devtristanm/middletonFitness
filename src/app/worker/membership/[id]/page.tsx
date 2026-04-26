"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MiddletonLogo } from "@/components/MiddletonLogo";
import type { AgreementInitials, MembershipRecord } from "@/lib/types";
import { brandPageShell, brandStaffHeaderBar } from "@/lib/siteChrome";

const agreementRows: { key: keyof AgreementInitials; label: string }[] = [
  { key: "monthToMonth", label: "Month-to-month / cancellation timing" },
  { key: "guestCode", label: "Access code and guests" },
  { key: "redlightTanning", label: "Red light therapy and tanning" },
  { key: "gymAttire", label: "Gym attire and conduct" },
  { key: "liability", label: "Assumption of risk / liability" },
];

export default function WorkerMembershipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [m, setM] = useState<MembershipRecord | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/memberships/${id}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Not found");
      setM(null);
      return;
    }
    setM(data.membership as MembershipRecord);
    setError(null);
  }, [id]);

  useEffect(() => {
    if (!Number.isInteger(id)) {
      setM(null);
      setError("Invalid id");
      return;
    }
    load();
  }, [id, load]);

  async function setStatus(status: "active" | "cancelled") {
    if (!m) return;
    const ok =
      status === "cancelled"
        ? window.confirm(
            "Cancel this membership? You can reactivate later from this page."
          )
        : window.confirm("Reactivate this membership?");
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/memberships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Update failed");
      setM(data.membership as MembershipRecord);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (m === undefined) {
    return (
      <div className={`${brandPageShell} px-4 py-16`}>
        <div className="mx-auto mb-8 flex max-w-3xl justify-center">
          <MiddletonLogo size="sm" />
        </div>
        <p className="text-center text-sm text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (!m) {
    return (
      <div className={`${brandPageShell} px-4 py-16`}>
        <div className="mx-auto mb-8 flex max-w-3xl justify-center">
          <MiddletonLogo size="sm" />
        </div>
        <div className="mx-auto max-w-lg text-center">
          <p className="text-zinc-400">{error || "Not found"}</p>
          <Link
            href="/worker/dashboard"
            className="mt-4 inline-block text-sm text-accent hover:text-accent-hover"
          >
            ← Dashboard
          </Link>
        </div>
      </div>
    );
  }

  function formatCardNumber(digits: string) {
    const d = digits.replace(/\D/g, "");
    return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }

  const cardDigits = m.payment?.cardNumber ?? "";

  return (
    <div className={`${brandPageShell} pb-16`}>
      <header className={brandStaffHeaderBar}>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <MiddletonLogo size="sm" />
            <button
              type="button"
              onClick={() => router.push("/worker/dashboard")}
              className="text-sm text-zinc-400 transition hover:text-accent"
            >
              ← All sheets
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/worker/membership/${id}/edit`}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Edit sheet
            </Link>
            {m.status === "active" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setStatus("cancelled")}
                className="rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-950/60 disabled:opacity-50"
              >
                Cancel membership
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => setStatus("active")}
                className="rounded-lg border border-zinc-600 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800/80 disabled:opacity-50"
              >
                Reactivate
              </button>
            )}
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="rounded-2xl border border-zinc-800 bg-white p-6 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="font-display text-2xl font-bold text-ink">
              Membership {m.membershipId}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                m.status === "active"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {m.status}
            </span>
          </div>
          <p className="mt-1 text-sm capitalize text-ink-muted">{m.type}</p>
          <p className="mt-2 text-xs text-ink-muted">
            Submitted {new Date(m.createdAt).toLocaleString()} · Updated{" "}
            {new Date(m.updatedAt).toLocaleString()}
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-white p-6 shadow-xl shadow-black/20">
          <h2 className="font-display text-lg font-semibold text-ink">
            Primary member
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-muted">Name</dt>
              <dd className="font-medium text-ink">{m.primary.fullName}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Date of birth</dt>
              <dd className="text-ink">{m.primary.dateOfBirth}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Email</dt>
              <dd className="text-ink">{m.primary.email}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Phone</dt>
              <dd className="text-ink">{m.primary.phone}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-ink-muted">Address</dt>
              <dd className="whitespace-pre-wrap text-ink">{m.primary.address}</dd>
            </div>
          </dl>
        </section>

        {m.type === "family" && m.spouse ? (
          <section className="rounded-2xl border border-zinc-800 bg-white p-6 shadow-xl shadow-black/20">
            <h2 className="font-display text-lg font-semibold text-ink">Spouse</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Name</dt>
                <dd className="font-medium text-ink">{m.spouse.fullName}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Age</dt>
                <dd className="text-ink">{m.spouse.age}</dd>
              </div>
            </dl>
          </section>
        ) : null}

        {m.children.length > 0 ? (
          <section className="rounded-2xl border border-zinc-800 bg-white p-6 shadow-xl shadow-black/20">
            <h2 className="font-display text-lg font-semibold text-ink">
              Children
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {m.children.map((c, i) => (
                <li
                  key={i}
                  className="flex justify-between rounded-lg border border-surface-border px-3 py-2"
                >
                  <span className="font-medium text-ink">{c.fullName}</span>
                  <span className="text-ink-muted">Age {c.age}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-2xl border border-zinc-800 bg-white p-6 shadow-xl shadow-black/20">
          <h2 className="font-display text-lg font-semibold text-ink">
            Payment on file
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            Staff-only: handle card data according to your policies and PCI rules.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-ink-muted">Card number</dt>
              <dd className="font-mono text-sm text-ink">
                {cardDigits ? formatCardNumber(cardDigits) : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-ink-muted">Name on card</dt>
              <dd className="text-ink">{m.payment?.cardholderName || "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Expiration</dt>
              <dd className="font-mono text-ink">{m.payment?.expiration || "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">CVV</dt>
              <dd className="font-mono text-ink">{m.payment?.cvv || "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Billing ZIP</dt>
              <dd className="text-ink">{m.payment?.billingZip || "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-white p-6 shadow-xl shadow-black/20">
          <h2 className="font-display text-lg font-semibold text-ink">
            Agreement initials
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {agreementRows.map((row) => (
              <li key={row.key} className="flex flex-wrap justify-between gap-2">
                <span className="text-ink-muted">{row.label}</span>
                <span className="font-mono font-semibold">
                  {m.agreementInitials[row.key]}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-white p-6 shadow-xl shadow-black/20">
          <h2 className="font-display text-lg font-semibold text-ink">
            Printed name, signature, date
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-muted">Printed name</dt>
              <dd className="font-medium text-ink">{m.printedName}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Date</dt>
              <dd className="text-ink">{m.agreementDate}</dd>
            </div>
          </dl>
          <h3 className="mt-6 text-sm font-semibold text-ink">Signature on file</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.signatureDataUrl}
            alt="Member signature"
            className="mt-2 max-h-48 rounded-lg border border-surface-border bg-white object-contain"
          />
        </section>

        {m.notes ? (
          <section className="rounded-2xl border border-zinc-800 bg-white p-6 shadow-xl shadow-black/20">
            <h2 className="font-display text-lg font-semibold text-ink">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
              {m.notes}
            </p>
          </section>
        ) : null}
      </article>
    </div>
  );
}
