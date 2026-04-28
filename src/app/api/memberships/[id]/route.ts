import { NextResponse } from "next/server";
import { getMembership, updateMembership } from "@/lib/membershipStore";
import type { MembershipRecord } from "@/lib/types";
import { parseUpdateMembershipBody } from "@/lib/validateMembership";
import { isWorkerAuthenticated } from "@/lib/workerSession";

type Ctx = { params: { id: string } };

export async function GET(_request: Request, context: Ctx) {
  if (!(await isWorkerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = context.params;
  const membershipId = Number(id);
  if (!Number.isInteger(membershipId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const m = await getMembership(membershipId);
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ membership: m });
}

export async function PATCH(request: Request, context: Ctx) {
  if (!(await isWorkerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = context.params;
  const membershipId = Number(id);
  if (!Number.isInteger(membershipId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const keys = Object.keys(body);

  const ownerNotesOnly =
    keys.length === 1 &&
    "ownerNotes" in body &&
    typeof body.ownerNotes === "string";

  if (ownerNotesOnly) {
    const ownerNotes = String(body.ownerNotes).slice(0, 5000);
    const updated = await updateMembership(membershipId, { ownerNotes });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ membership: updated });
  }

  const statusOnly =
    keys.length === 1 &&
    (body.status === "cancelled" || body.status === "active");

  if (statusOnly) {
    const existing = await getMembership(membershipId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const now = new Date().toISOString();
    const nextStatus = body.status as "active" | "cancelled";
    const patch: Partial<Omit<MembershipRecord, "membershipId" | "createdAt">> = {
      status: nextStatus,
    };
    if (nextStatus === "cancelled" && existing.status === "active") {
      patch.cancelledAt = now;
    }
    if (nextStatus === "active") {
      patch.cancelledAt = null;
    }
    const updated = await updateMembership(membershipId, patch);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ membership: updated });
  }

  const parsed = parseUpdateMembershipBody(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
  const existing = await getMembership(membershipId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const signatureDataUrl =
    data.signatureDataUrl ?? existing.signatureDataUrl;

  const now = new Date().toISOString();
  try {
    const updated = await updateMembership(membershipId, {
      type: data.type,
      primary: data.primary,
      spouse: data.type === "family" ? data.spouse : null,
      children: data.type === "family" ? data.children : [],
      payment: data.payment,
      agreementInitials: data.agreementInitials,
      signatureDataUrl,
      printedName: data.printedName,
      agreementDate: data.agreementDate,
      notes: data.notes ?? existing.notes,
      status: existing.status,
      cancelledAt: existing.cancelledAt,
      ownerNotes: existing.ownerNotes,
      lastSheetEditAt: now,
    });

    return NextResponse.json({ membership: updated });
  } catch (err) {
    console.error("updateMembership failed:", err);
    return NextResponse.json(
      { error: "Could not save changes. Try again or contact support." },
      { status: 503 }
    );
  }
}
