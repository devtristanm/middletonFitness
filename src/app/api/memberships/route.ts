import { NextResponse } from "next/server";
import { addMembership, listMemberships } from "@/lib/membershipStore";
import { parseCreateMembershipBody } from "@/lib/validateMembership";
import { isWorkerAuthenticated } from "@/lib/workerSession";

export async function GET() {
  if (!(await isWorkerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const memberships = await listMemberships();
  return NextResponse.json({ memberships });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseCreateMembershipBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
  try {
    const record = await addMembership({
      status: "active",
      type: data.type,
      primary: data.primary,
      spouse: data.type === "family" ? data.spouse : null,
      children: data.type === "family" ? data.children : [],
      payment: data.payment,
      agreementInitials: data.agreementInitials,
      signatureDataUrl: data.signatureDataUrl,
      printedName: data.printedName,
      agreementDate: data.agreementDate,
      notes: data.notes ?? "",
    });

    return NextResponse.json({
      membershipId: record.membershipId,
      createdAt: record.createdAt,
    });
  } catch (err) {
    const postgrest = err as {
      code?: string;
      message?: string;
      details?: string;
    };
    const message = err instanceof Error ? err.message : String(err);
    const combined = [message, postgrest.details, String(postgrest?.code)]
      .filter(Boolean)
      .join(" ");
    console.error("addMembership failed:", combined, err);
    const isConfig = message.includes("Missing Supabase env");
    if (
      /413|content[\s-]?type|entity too large|payload too|too large|maximum.*size|PGRST122|exceeds|request.*(too )?large|body.*(too )?large/i.test(
        combined
      )
    ) {
      return NextResponse.json(
        {
          error:
            "The saved signature or form is too large for the server. Clear the signature, draw a simpler one, and try again.",
        },
        { status: 413 }
      );
    }
    return NextResponse.json(
      {
        error: isConfig
          ? "Server configuration error: Supabase environment variables are missing or invalid."
          : "Could not save your application. Try again in a moment, or ask staff for help.",
      },
      { status: isConfig ? 500 : 503 }
    );
  }
}
