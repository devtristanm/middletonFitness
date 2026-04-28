"use client";

import Link from "next/link";
import { useState } from "react";
import { MembershipForm } from "@/components/MembershipForm";
import { MiddletonLogo } from "@/components/MiddletonLogo";
import { brandPageShell } from "@/lib/siteChrome";

const shell = `${brandPageShell} px-4 py-12 md:py-16`;

export default function SignupPage() {
  const [memberId, setMemberId] = useState<number | null>(null);

  return (
    <main className={shell}>
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <div className="mb-6 flex flex-col items-center gap-4">
            <MiddletonLogo size="lg" priority />
            <Link
              href="/"
              className="text-sm font-medium text-zinc-400 transition hover:text-accent"
            >
              ← Home
            </Link>
          </div>
          <div className="mx-auto max-w-xl">
            <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-50 md:text-4xl">
              New membership
            </h1>
          </div>
        </header>
        <MembershipForm
          mode="create"
          submitLabel="Submit application"
          onSubmit={async ({ values, signatureDataUrl }) => {
            const res = await fetch("/api/memberships", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: values.type,
                primary: values.primary,
                spouse: values.type === "family" ? values.spouse : null,
                children: values.type === "family" ? values.children : [],
                payment: values.payment,
                agreementInitials: values.agreementInitials,
                signatureDataUrl,
                printedName: values.printedName,
                agreementDate: values.agreementDate,
                notes: values.notes,
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(data.error || "Could not submit signup");
            }
            setMemberId(data.membershipId as number);
          }}
        />
      </div>

      {memberId !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signup-member-modal-title"
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-center shadow-2xl shadow-black/50 sm:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex justify-center">
              <MiddletonLogo size="md" priority />
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              Welcome
            </p>
            <h2
              id="signup-member-modal-title"
              className="mt-3 font-display text-2xl font-bold text-zinc-50"
            >
              You&apos;re signed up
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Save your membership ID for your records. Our team may ask for it
              at check-in.
            </p>
            <p className="mt-8 font-display text-5xl font-bold tabular-nums tracking-tight text-zinc-50 sm:text-6xl">
              {memberId}
            </p>
            <p className="mt-2 text-sm text-zinc-500">Membership ID</p>
            <Link
              href="/"
              className="mt-10 inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              Back to home
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}
