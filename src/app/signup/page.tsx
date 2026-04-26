"use client";

import Link from "next/link";
import { useState } from "react";
import { MembershipForm } from "@/components/MembershipForm";
import { MiddletonLogo } from "@/components/MiddletonLogo";
import { brandPageShell } from "@/lib/siteChrome";

const shell = `${brandPageShell} px-4 py-12 md:py-16`;

export default function SignupPage() {
  const [done, setDone] = useState<{ id: number } | null>(null);

  if (done) {
    return (
      <main className={shell}>
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/90 p-10 text-center shadow-xl shadow-black/40 backdrop-blur-sm">
          <div className="mb-8 flex justify-center">
            <MiddletonLogo size="md" priority />
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Welcome
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold text-zinc-50">
            You&apos;re signed up
          </h1>
          <p className="mt-3 text-zinc-400">
            Save your membership ID for your records. Our team may ask for it at
            check-in.
          </p>
          <p className="mt-8 font-display text-4xl font-bold tabular-nums text-zinc-50">
            {done.id}
          </p>
          <p className="mt-2 text-sm text-zinc-500">Membership ID</p>
          <Link
            href="/"
            className="mt-10 inline-flex rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

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
            <p className="mt-3 text-zinc-400">
              Membership numbers are assigned in order starting at{" "}
              <span className="font-semibold text-zinc-200">1280</span>.
            </p>
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
            setDone({ id: data.membershipId as number });
          }}
        />
      </div>
    </main>
  );
}
