import { NextResponse } from "next/server";

type ErrLike = {
  code?: string | number;
  message?: string;
  details?: string;
  hint?: string;
};

function combinedErrorText(err: unknown): string {
  const e = err as ErrLike;
  const message = err instanceof Error ? err.message : String(err);
  return [
    message,
    e.message,
    e.details,
    e.hint,
    String(e.code),
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Maps database errors to JSON responses for membership API routes.
 */
export function membershipMutationErrorResponse(
  err: unknown,
  kind: "create" | "update"
): NextResponse {
  const e = err as ErrLike;
  const combined = combinedErrorText(err);

  console.error("membership mutation error:", e.code ?? "", combined, err);

  if (
    /Missing MongoDB connection string|MONGO_DB_CONNECTION_STRING|MONGODB_URI/i.test(
      combined
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Server configuration error: database connection string is not set or is invalid (MONGO_DB_CONNECTION_STRING or MONGODB_URI).",
      },
      { status: 500 }
    );
  }

  if (
    /413|content[\s-]?type|entity too large|payload too|too large|maximum.*size|exceeds|request.*(too )?large|body.*(too )?large/i.test(
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

  if (
    /authentication failed|bad auth|not authorized on|ECONNREFUSED|ETIMEDOUT|MongoNetworkError/i.test(
      combined
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Could not reach the database. Check MONGO_DB_CONNECTION_STRING (or MONGODB_URI) and network access (Atlas IP allowlist).",
      },
      { status: 502 }
    );
  }

  const allowDetail =
    process.env.VERCEL_ENV !== "production" ||
    process.env.MEMBERSHIP_API_DEBUG === "1";

  const generic =
    kind === "create"
      ? "Could not save your application. Try again in a moment, or ask staff for help."
      : "Could not save changes. Try again or contact support.";

  if (allowDetail && e.message) {
    return NextResponse.json(
      {
        error: generic,
        code: e.code,
        detail: e.message,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: generic }, { status: 503 });
}

export function membershipReadErrorResponse(err: unknown): NextResponse {
  const e = err as ErrLike;
  const combined = combinedErrorText(err);
  console.error("membership read error:", e.code ?? "", combined, err);

  if (
    /Missing MongoDB connection string|MONGO_DB_CONNECTION_STRING|MONGODB_URI/i.test(
      combined
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Server configuration error: database connection string is not set or is invalid (MONGO_DB_CONNECTION_STRING or MONGODB_URI).",
      },
      { status: 500 }
    );
  }

  if (
    /authentication failed|bad auth|ECONNREFUSED|ETIMEDOUT|MongoNetworkError/i.test(
      combined
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Could not reach the database. Check MONGO_DB_CONNECTION_STRING (or MONGODB_URI) and Atlas network access.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { error: "Could not load membership data. Try again or contact support." },
    { status: 503 }
  );
}
