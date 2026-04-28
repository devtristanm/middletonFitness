export type MembershipType = "individual" | "family";

export type MembershipStatus = "active" | "cancelled";

/** Account holder / primary member — full contact and mailing address. */
export type PersonInfo = {
  fullName: string;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  /** USPS two-letter state code */
  state: string;
  zip: string;
  email: string;
  phone: string;
};

/** Spouse on a family plan — name and age only. */
export type SpouseInfo = {
  fullName: string;
  age: number;
};

export type ChildInfo = {
  fullName: string;
  age: number;
};

export type PaymentInfo = {
  cardNumber: string;
  cardholderName: string;
  expiration: string;
  cvv: string;
  billingZip: string;
};

export type AgreementInitials = {
  monthToMonth: string;
  guestCode: string;
  redlightTanning: string;
  gymAttire: string;
  liability: string;
};

export type MembershipRecord = {
  membershipId: number;
  createdAt: string;
  updatedAt: string;
  status: MembershipStatus;
  type: MembershipType;
  primary: PersonInfo;
  spouse: SpouseInfo | null;
  children: ChildInfo[];
  payment: PaymentInfo;
  agreementInitials: AgreementInitials;
  signatureDataUrl: string;
  /** Printed name as written on the agreement line. */
  printedName: string;
  /** Date next to signature (YYYY-MM-DD). */
  agreementDate: string;
  notes: string;
  /** When status became cancelled (ISO). Cleared on reactivate. */
  cancelledAt: string | null;
  /** Last time staff saved the membership form (edit sheet), ISO. */
  lastSheetEditAt: string | null;
  /** Staff / owner-only notes (not on public signup). */
  ownerNotes: string;
};

export type MembershipsFile = {
  nextId: number;
  memberships: MembershipRecord[];
};
