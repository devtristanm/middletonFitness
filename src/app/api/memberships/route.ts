import { NextResponse } from "next/server";
import { addMembership, listMemberships } from "@/lib/membershipStore";
import { membershipMutationErrorResponse, membershipReadErrorResponse } from "@/lib/membershipRouteResponse";
import { parseCreateMembershipBody } from "@/lib/validateMembership";
import { isProductionWithoutMongoUri } from "@/lib/mongo/env";
import { isWorkerAuthenticated } from "@/lib/workerSession";

export async function GET() {
  if (!(await isWorkerAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const memberships = await listMemberships();
    return NextResponse.json({ memberships });
  } catch (err) {
    return membershipReadErrorResponse(err);
  }
}

export async function POST(request: Request) {
  if (isProductionWithoutMongoUri()) {
    return NextResponse.json(
      {
        error:
          "Server configuration error: MONGO_DB_CONNECTION_STRING (or MONGODB_URI) is required in production.",
      },
      { status: 500 }
    );
  }

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
    return membershipMutationErrorResponse(err, "create");
  }
}
