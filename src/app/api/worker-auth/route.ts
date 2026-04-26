import { NextResponse } from "next/server";
import {
  clearWorkerSessionCookie,
  getWorkerPassword,
  setWorkerSessionCookie,
} from "@/lib/workerSession";

export async function POST(request: Request) {
  const password = getWorkerPassword();
  if (!password) {
    return NextResponse.json(
      { error: "Server is not configured with WORKER_PASSWORD" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const submitted =
    body && typeof body === "object" && "password" in body
      ? String((body as { password: unknown }).password)
      : "";

  if (submitted !== password) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await setWorkerSessionCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearWorkerSessionCookie();
  return NextResponse.json({ ok: true });
}
