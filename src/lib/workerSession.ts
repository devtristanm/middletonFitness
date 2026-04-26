import { cookies } from "next/headers";
import { workerSessionToken } from "./workerSession.shared";

const COOKIE = "gym_worker_session";
const MAX_AGE = 60 * 60 * 24 * 7;

export function getWorkerPassword(): string | undefined {
  return process.env.WORKER_PASSWORD;
}

export async function isWorkerAuthenticated(): Promise<boolean> {
  const expected = getWorkerPassword();
  if (!expected) return false;
  const jar = await cookies();
  return jar.get(COOKIE)?.value === workerSessionToken(expected);
}

export async function setWorkerSessionCookie() {
  const secret = getWorkerPassword();
  if (!secret) throw new Error("WORKER_PASSWORD is not configured");
  const jar = await cookies();
  jar.set(COOKIE, workerSessionToken(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearWorkerSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
