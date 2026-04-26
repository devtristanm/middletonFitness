import Link from "next/link";
import { MiddletonLogo } from "@/components/MiddletonLogo";
import { brandPageShell } from "@/lib/siteChrome";

export default function HomePage() {
  return (
    <main className={`${brandPageShell} px-4 py-16 md:py-24`}>
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <MiddletonLogo size="lg" priority />
        <h1 className="mt-10 font-display text-4xl font-bold tracking-tight text-zinc-50 md:text-5xl">
          Membership signup
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-400">
          Complete your membership online with initials on each agreement and a
          secure electronic signature.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-accent-hover"
          >
            Start membership signup
          </Link>
          <Link
            href="/worker/login"
            className="rounded-xl border border-zinc-600 bg-zinc-900/60 px-8 py-3 text-sm font-semibold text-zinc-100 shadow-sm backdrop-blur-sm transition hover:border-zinc-500 hover:bg-zinc-800/80"
          >
            Staff sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
