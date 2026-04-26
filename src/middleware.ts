import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { workerSessionToken } from "@/lib/workerSession.shared";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/worker")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/worker/login")) {
    return NextResponse.next();
  }

  const password = process.env.WORKER_PASSWORD;
  if (!password) {
    return NextResponse.redirect(new URL("/worker/login?err=config", request.url));
  }

  const expected = workerSessionToken(password);
  const cookie = request.cookies.get("gym_worker_session")?.value;
  if (cookie !== expected) {
    const login = new URL("/worker/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/worker", "/worker/:path*"],
};
