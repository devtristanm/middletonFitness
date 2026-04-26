"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MiddletonLogo } from "@/components/MiddletonLogo";
import { brandPageShell } from "@/lib/siteChrome";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/worker/dashboard";
  const err = search.get("err");

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    err === "config"
      ? "This site is not configured for staff access yet (missing WORKER_PASSWORD)."
      : null
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/worker-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Sign in failed");
        return;
      }
      router.replace(next.startsWith("/worker") ? next : "/worker/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={`${brandPageShell} flex min-h-screen flex-col items-center justify-center px-4 py-12`}
    >
      <div className="mb-8">
        <MiddletonLogo size="lg" priority />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-xl shadow-black/40 backdrop-blur-sm">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-accent">
          Staff only
        </p>
        <h1 className="mt-2 text-center font-display text-2xl font-bold text-zinc-50">
          Worker sign in
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          View past signup sheets, edit mistakes, or cancel memberships.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-accent/30 placeholder:text-zinc-600 focus:border-accent focus:ring-2"
              required
            />
          </label>
          {error ? (
            <p className="rounded-lg border border-amber-900/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <Link
          href="/"
          className="mt-6 block text-center text-sm text-zinc-400 transition hover:text-accent"
        >
          ← Public site
        </Link>
      </div>
    </main>
  );
}

function LoginFallback() {
  return (
    <div
      className={`${brandPageShell} flex min-h-screen items-center justify-center px-4`}
    >
      <div className="flex flex-col items-center gap-6">
        <MiddletonLogo size="lg" />
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    </div>
  );
}

export default function WorkerLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
