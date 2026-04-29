import type {
  AgreementInitials,
  ChildInfo,
  MembershipType,
  PaymentInfo,
  PersonInfo,
  SpouseInfo,
} from "./types";
import { isValidUsStateCode } from "./usStates";

export type CreateMembershipBody = {
  type: MembershipType;
  primary: PersonInfo;
  spouse: SpouseInfo | null;
  children: ChildInfo[];
  payment: PaymentInfo;
  agreementInitials: AgreementInitials;
  signatureDataUrl: string;
  printedName: string;
  agreementDate: string;
  notes?: string;
};

export type UpdateMembershipBody = Omit<
  CreateMembershipBody,
  "signatureDataUrl"
> & {
  signatureDataUrl?: string;
};

const agreementKeys: (keyof AgreementInitials)[] = [
  "monthToMonth",
  "guestCode",
  "redlightTanning",
  "gymAttire",
  "liability",
];

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isZip(v: unknown): boolean {
  return typeof v === "string" && /^\d{5}(-\d{4})?$/.test(v.trim());
}

function isPersonInfo(v: unknown): v is PersonInfo {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  const state = typeof p.state === "string" ? p.state.trim().toUpperCase() : "";
  return (
    isNonEmptyString(p.fullName) &&
    isNonEmptyString(p.dateOfBirth) &&
    isNonEmptyString(p.addressLine1) &&
    isNonEmptyString(p.city) &&
    state.length === 2 &&
    isValidUsStateCode(state) &&
    isZip(p.zip) &&
    isNonEmptyString(p.email) &&
    isNonEmptyString(p.phone)
  );
}

function isSpouseInfo(v: unknown): v is SpouseInfo {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  if (!isNonEmptyString(s.fullName)) return false;
  const age = Number(s.age);
  return Number.isInteger(age) && age >= 18 && age <= 120;
}

function isChildInfo(v: unknown): v is ChildInfo {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  if (!isNonEmptyString(c.fullName)) return false;
  const age = Number(c.age);
  return Number.isInteger(age) && age >= 12 && age <= 20;
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function isPaymentInfo(v: unknown): v is PaymentInfo {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  if (!isNonEmptyString(p.cardholderName)) return false;
  const num = digitsOnly(String(p.cardNumber ?? ""));
  if (num.length < 12 || num.length > 19) return false;
  const exp = String(p.expiration ?? "").trim();
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return false;
  const cvv = digitsOnly(String(p.cvv ?? ""));
  if (cvv.length < 3 || cvv.length > 4) return false;
  const zip = String(p.billingZip ?? "").trim();
  if (!/^\d{5}(-\d{4})?$/.test(zip)) return false;
  return true;
}

function isIsoDate(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = Date.parse(s);
  return !Number.isNaN(t);
}

export function parseCreateMembershipBody(
  raw: unknown
): { ok: true; data: CreateMembershipBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid JSON body" };
  }
  const b = raw as Record<string, unknown>;

  const type = b.type === "individual" || b.type === "family" ? b.type : null;
  if (!type) {
    return { ok: false, error: "Membership type must be individual or family" };
  }

  if (!isPersonInfo(b.primary)) {
    return {
      ok: false,
      error:
        "Primary member: name, birthdate, full street address (line 1, city, state, ZIP), email, and phone are required",
    };
  }

  let spouse: SpouseInfo | null = null;
  if (type === "family") {
    if (!isSpouseInfo(b.spouse)) {
      return {
        ok: false,
        error: "Family membership requires spouse name and age (18+)",
      };
    }
    spouse = b.spouse;
  } else if (b.spouse != null && b.spouse !== "") {
    return { ok: false, error: "Individual membership should not include a spouse" };
  }

  const childrenRaw = b.children;
  if (!Array.isArray(childrenRaw)) {
    return { ok: false, error: "children must be an array" };
  }
  const children: ChildInfo[] = [];
  for (const c of childrenRaw) {
    if (!isChildInfo(c)) {
      return {
        ok: false,
        error: "Each child needs full name and age between 12 and 20",
      };
    }
    children.push(c);
  }

  if (type === "individual" && children.length > 0) {
    return {
      ok: false,
      error: "Individual membership cannot include children on this form",
    };
  }

  if (!isPaymentInfo(b.payment)) {
    return {
      ok: false,
      error:
        "Payment: valid card number, cardholder name, expiration (MM/YY), CVV, and billing ZIP (12345 or 12345-6789) are required",
    };
  }

  if (!b.agreementInitials || typeof b.agreementInitials !== "object") {
    return { ok: false, error: "Agreement initials required" };
  }
  const ai = b.agreementInitials as Record<string, unknown>;
  const agreementInitials: AgreementInitials = {
    monthToMonth: "",
    guestCode: "",
    redlightTanning: "",
    gymAttire: "",
    liability: "",
  };
  for (const key of agreementKeys) {
    const v = ai[key];
    if (!isNonEmptyString(v) || v.trim().length > 8) {
      return { ok: false, error: `Initials required for ${key}` };
    }
    agreementInitials[key] = v.trim().toUpperCase();
  }

  if (!isNonEmptyString(b.signatureDataUrl)) {
    return { ok: false, error: "Signature is required" };
  }
  const sig = b.signatureDataUrl as string;
  if (sig.length > 1_500_000) {
    return {
      ok: false,
      error:
        "Signature data is too large. Clear the signature, draw it again, and resubmit. If the problem continues, use a different browser or turn off the device display zoom for this page.",
    };
  }
  if (!sig.startsWith("data:image/")) {
    return { ok: false, error: "Invalid signature format" };
  }

  if (!isNonEmptyString(b.printedName)) {
    return { ok: false, error: "Printed name is required" };
  }

  if (!isIsoDate(b.agreementDate)) {
    return { ok: false, error: "Valid agreement date (YYYY-MM-DD) is required" };
  }

  const pay = b.payment as PaymentInfo;
  const notes =
    typeof b.notes === "string" ? b.notes.slice(0, 2000) : "";

  return {
    ok: true,
    data: {
      type,
      primary: {
        fullName: (b.primary as PersonInfo).fullName.trim(),
        dateOfBirth: (b.primary as PersonInfo).dateOfBirth.trim(),
        addressLine1: (b.primary as PersonInfo).addressLine1.trim(),
        addressLine2: String(
          (b.primary as PersonInfo).addressLine2 ?? ""
        ).trim(),
        city: (b.primary as PersonInfo).city.trim(),
        state: String((b.primary as PersonInfo).state).trim().toUpperCase(),
        zip: String((b.primary as PersonInfo).zip).trim(),
        email: (b.primary as PersonInfo).email.trim(),
        phone: (b.primary as PersonInfo).phone.trim(),
      },
      spouse:
        spouse &&
        ({
          fullName: spouse.fullName.trim(),
          age: spouse.age,
        } as SpouseInfo),
      children,
      payment: {
        cardNumber: digitsOnly(pay.cardNumber),
        cardholderName: pay.cardholderName.trim(),
        expiration: pay.expiration.trim(),
        cvv: digitsOnly(pay.cvv),
        billingZip: pay.billingZip.trim(),
      },
      agreementInitials,
      signatureDataUrl: sig,
      printedName: String(b.printedName).trim(),
      agreementDate: String(b.agreementDate).trim(),
      notes,
    },
  };
}

/** Same as signup validation, but signature may be omitted to keep the existing image. */
export function parseUpdateMembershipBody(
  raw: unknown
): { ok: true; data: UpdateMembershipBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid JSON body" };
  }
  const b = raw as Record<string, unknown>;
  const base = { ...b };
  const sigIn = b.signatureDataUrl;
  const hasSig =
    typeof sigIn === "string" &&
    sigIn.trim().length > 0 &&
    sigIn.startsWith("data:image/");
  if (!hasSig) {
    delete base.signatureDataUrl;
  }
  const parsed = parseCreateMembershipBody({
    ...base,
    signatureDataUrl: hasSig
      ? sigIn
      : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  });
  if (!parsed.ok) return parsed;
  if (!hasSig) {
    const { signatureDataUrl: _, ...withoutSig } = parsed.data;
    return {
      ok: true,
      data: { ...withoutSig, notes: withoutSig.notes },
    };
  }
  return { ok: true, data: parsed.data };
}
