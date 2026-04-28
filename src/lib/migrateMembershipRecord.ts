import type {
  AgreementInitials,
  MembershipRecord,
  PaymentInfo,
  PersonInfo,
  SpouseInfo,
} from "./types";

function emptyPayment(): PaymentInfo {
  return {
    cardNumber: "",
    cardholderName: "",
    expiration: "",
    cvv: "",
    billingZip: "",
  };
}

function ageFromDateOfBirth(dob: string): number | null {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function migratePrimary(p: unknown): PersonInfo {
  const empty: PersonInfo = {
    fullName: "",
    dateOfBirth: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
    email: "",
    phone: "",
  };
  if (!p || typeof p !== "object") return empty;
  const o = p as Record<string, unknown>;
  const legacy = String(o.address ?? "").trim();
  const lines = legacy.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const line1Direct = String(o.addressLine1 ?? "").trim();
  const line2Direct = String(o.addressLine2 ?? "").trim();
  const addressLine1 =
    line1Direct || lines[0] || legacy || "";
  const extraLegacy =
    !line1Direct && lines.length > 1 ? lines.slice(1).join(", ") : "";
  const addressLine2 = line2Direct || extraLegacy;
  return {
    fullName: String(o.fullName ?? "").trim(),
    dateOfBirth: String(o.dateOfBirth ?? "").trim(),
    addressLine1,
    addressLine2,
    city: String(o.city ?? "").trim(),
    state: String(o.state ?? "").trim().toUpperCase().slice(0, 2),
    zip: String(o.zip ?? "").trim(),
    email: String(o.email ?? "").trim(),
    phone: String(o.phone ?? "").trim(),
  };
}

function migratePayment(p: unknown): PaymentInfo {
  if (!p || typeof p !== "object") return emptyPayment();
  const o = p as Record<string, unknown>;
  return {
    cardNumber: String(o.cardNumber ?? "").trim(),
    cardholderName: String(o.cardholderName ?? "").trim(),
    expiration: String(o.expiration ?? "").trim(),
    cvv: String(o.cvv ?? "").trim(),
    billingZip: String(o.billingZip ?? "").trim(),
  };
}

function migrateSpouse(s: unknown): SpouseInfo | null {
  if (!s || typeof s !== "object") return null;
  const o = s as Record<string, unknown>;
  if (typeof o.age === "number" && Number.isInteger(o.age)) {
    return {
      fullName: String(o.fullName ?? "").trim(),
      age: o.age,
    };
  }
  const dob = String(o.dateOfBirth ?? "");
  const computed = dob ? ageFromDateOfBirth(dob) : null;
  const age =
    computed != null
      ? Math.min(120, Math.max(18, computed))
      : 18;
  return {
    fullName: String(o.fullName ?? "").trim(),
    age,
  };
}

function migrateAgreements(raw: unknown): AgreementInitials {
  const empty: AgreementInitials = {
    monthToMonth: "",
    guestCode: "",
    redlightTanning: "",
    gymAttire: "",
    liability: "",
  };
  if (!raw || typeof raw !== "object") return empty;
  const a = raw as Record<string, string>;
  const isLegacy =
    "liabilityWaiver" in a &&
    !("monthToMonth" in a) &&
    !("guestCode" in a);
  if (!isLegacy) {
    return {
      monthToMonth: String(a.monthToMonth ?? "").toUpperCase(),
      guestCode: String(a.guestCode ?? "").toUpperCase(),
      redlightTanning: String(a.redlightTanning ?? "").toUpperCase(),
      gymAttire: String(a.gymAttire ?? "").toUpperCase(),
      liability: String(a.liability ?? "").toUpperCase(),
    };
  }
  return {
    monthToMonth: String(a.membershipTerms ?? "").toUpperCase(),
    guestCode: String(a.billingAuthorization ?? "").toUpperCase(),
    redlightTanning: "",
    gymAttire: String(a.facilityRules ?? "").toUpperCase(),
    liability: String(a.liabilityWaiver ?? "").toUpperCase(),
  };
}

/** Normalize records saved under an older schema so the app can read them. */
export function migrateMembershipRecord(row: MembershipRecord): MembershipRecord {
  const primary = migratePrimary(row.primary);
  const payment = migratePayment(row.payment);
  const spouse =
    row.type === "family" ? migrateSpouse(row.spouse) : null;
  const agreementInitials = migrateAgreements(row.agreementInitials);
  const created = row.createdAt?.slice(0, 10) ?? "";

  const r = row as MembershipRecord & {
    cancelledAt?: unknown;
    lastSheetEditAt?: unknown;
    ownerNotes?: unknown;
  };
  const cancelledAt =
    typeof r.cancelledAt === "string" && r.cancelledAt.trim()
      ? r.cancelledAt.trim()
      : null;
  const lastSheetEditAt =
    typeof r.lastSheetEditAt === "string" && r.lastSheetEditAt.trim()
      ? r.lastSheetEditAt.trim()
      : null;
  const ownerNotes =
    typeof r.ownerNotes === "string" ? r.ownerNotes.slice(0, 5000) : "";

  return {
    ...row,
    primary,
    spouse,
    payment,
    agreementInitials,
    printedName: (row.printedName ?? primary.fullName).trim(),
    agreementDate: (row.agreementDate ?? created).trim(),
    children: Array.isArray(row.children) ? row.children : [],
    cancelledAt,
    lastSheetEditAt,
    ownerNotes,
  };
}
