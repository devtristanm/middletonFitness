"use client";

import { useMemo, useRef, useState } from "react";
import type {
  AgreementInitials,
  ChildInfo,
  MembershipType,
  PaymentInfo,
  PersonInfo,
  SpouseInfo,
} from "@/lib/types";
import { SignaturePad, type SignaturePadHandle } from "./SignaturePad";

const emptyPrimary: PersonInfo = {
  fullName: "",
  dateOfBirth: "",
  address: "",
  email: "",
  phone: "",
};

const emptySpouse: SpouseInfo = {
  fullName: "",
  age: 18,
};

const emptyPayment: PaymentInfo = {
  cardNumber: "",
  cardholderName: "",
  expiration: "",
  cvv: "",
  billingZip: "",
};

const emptyAgreements: AgreementInitials = {
  monthToMonth: "",
  guestCode: "",
  redlightTanning: "",
  gymAttire: "",
  liability: "",
};

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type MembershipFormValues = {
  type: MembershipType;
  primary: PersonInfo;
  spouse: SpouseInfo;
  children: ChildInfo[];
  payment: PaymentInfo;
  agreementInitials: AgreementInitials;
  printedName: string;
  agreementDate: string;
  notes: string;
};

type Props = {
  mode: "create" | "edit";
  initial?: Partial<MembershipFormValues>;
  submitLabel: string;
  onSubmit: (payload: {
    values: MembershipFormValues;
    signatureDataUrl: string | null;
  }) => Promise<void>;
};

const agreementCopy: {
  key: keyof AgreementInitials;
  title: string;
  body: string;
}[] = [
  {
    key: "monthToMonth",
    title: "Month-to-month membership",
    body: "I agree that my membership is a month-to-month membership and cannot be cancelled the same month.",
  },
  {
    key: "guestCode",
    title: "Access code and guests",
    body: "I agree to not allow any other people in the facility with my code. If I do, my privileges will be revoked and I will be charged the appropriate amount. Guest passes are available at the front desk for my guests.",
  },
  {
    key: "redlightTanning",
    title: "Red light therapy and tanning",
    body: "I agree that use of the free red light therapy and tanning is limited to one user per 24-hour period and a maximum duration of 15 minutes. I agree to always use eye protection and proper skin protection.",
  },
  {
    key: "gymAttire",
    title: "Conduct and attire",
    body: "I agree to wear appropriate gym attire and act correctly.",
  },
  {
    key: "liability",
    title: "Assumption of risk and release",
    body: "I understand that physical exercise and use of fitness equipment, tanning, red light therapy, and related activities involve inherent risks including injury, illness, or property damage. I voluntarily assume all such risks. To the fullest extent permitted by law, I release Middleton Fitness, its owners, employees, and agents from any liability arising from my participation except for gross negligence or willful misconduct.",
  },
];

function Field({
  label,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </span>
      <input
        {...inputProps}
        className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-ink outline-none ring-accent/30 placeholder:text-ink-muted/60 focus:border-accent focus:ring-2"
      />
    </label>
  );
}

export function MembershipForm({
  mode,
  initial,
  submitLabel,
  onSubmit,
}: Props) {
  const sigRef = useRef<SignaturePadHandle>(null);
  const [type, setType] = useState<MembershipType>(
    initial?.type ?? "individual"
  );
  const [primary, setPrimary] = useState<PersonInfo>(
    initial?.primary ?? { ...emptyPrimary }
  );
  const [spouse, setSpouse] = useState<SpouseInfo>(
    initial?.spouse ?? { ...emptySpouse }
  );
  const [children, setChildren] = useState<ChildInfo[]>(
    initial?.children?.length ? initial!.children! : []
  );
  const [payment, setPayment] = useState<PaymentInfo>(
    initial?.payment ?? { ...emptyPayment }
  );
  const [agreementInitials, setAgreementInitials] =
    useState<AgreementInitials>(
      initial?.agreementInitials ?? { ...emptyAgreements }
    );
  const [printedName, setPrintedName] = useState(
    initial?.printedName ?? ""
  );
  const [agreementDate, setAgreementDate] = useState(
    initial?.agreementDate ?? todayIsoDate()
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showSpouse = type === "family";

  const agreementBlocks = useMemo(() => agreementCopy, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const sig: string | null =
      mode === "create"
        ? sigRef.current?.toDataURL() ?? null
        : sigRef.current?.isEmpty()
          ? null
          : sigRef.current?.toDataURL() ?? null;
    if (mode === "create" && !sig) {
      setError("Please sign in the signature box.");
      return;
    }
    if (!printedName.trim()) {
      setError("Printed name is required.");
      return;
    }
    if (!agreementDate) {
      setError("Agreement date is required.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        values: {
          type,
          primary,
          spouse,
          children: type === "family" ? children : [],
          payment,
          agreementInitials,
          printedName: printedName.trim(),
          agreementDate,
          notes,
        },
        signatureDataUrl: sig,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function addChild() {
    setChildren((c) => [...c, { fullName: "", age: 12 }]);
  }

  function updateChild(i: number, patch: Partial<ChildInfo>) {
    setChildren((rows) =>
      rows.map((row, j) => (j === i ? { ...row, ...patch } : row))
    );
  }

  function removeChild(i: number) {
    setChildren((rows) => rows.filter((_, j) => j !== i));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm md:p-8">
        <h2 className="font-display text-lg font-semibold text-ink">
          Membership type
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Individual covers you only. Family includes you, your spouse (name and
          age), and optional dependent children ages 12–20 (name and age).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 transition ${
              type === "individual"
                ? "border-accent bg-accent-soft/40"
                : "border-surface-border bg-white hover:border-surface-border"
            }`}
          >
            <input
              type="radio"
              name="mtype"
              className="sr-only"
              checked={type === "individual"}
              onChange={() => setType("individual")}
            />
            <span className="font-medium text-ink">Individual</span>
            <span className="mt-1 text-sm text-ink-muted">Member: yourself</span>
          </label>
          <label
            className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 transition ${
              type === "family"
                ? "border-accent bg-accent-soft/40"
                : "border-surface-border bg-white hover:border-surface-border"
            }`}
          >
            <input
              type="radio"
              name="mtype"
              className="sr-only"
              checked={type === "family"}
              onChange={() => setType("family")}
            />
            <span className="font-medium text-ink">Family</span>
            <span className="mt-1 text-sm text-ink-muted">
              You, spouse (name + age), optional kids 12–20
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm md:p-8">
        <h2 className="font-display text-lg font-semibold text-ink">
          Primary member
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Name, birthdate, address, email, and phone for the account holder.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              label="Full name"
              required
              value={primary.fullName}
              onChange={(e) =>
                setPrimary((p) => ({ ...p, fullName: e.target.value }))
              }
            />
          </div>
          <Field
            label="Date of birth"
            type="date"
            required
            value={primary.dateOfBirth}
            onChange={(e) =>
              setPrimary((p) => ({ ...p, dateOfBirth: e.target.value }))
            }
          />
          <Field
            label="Email"
            type="email"
            required
            value={primary.email}
            onChange={(e) =>
              setPrimary((p) => ({ ...p, email: e.target.value }))
            }
          />
          <Field
            label="Phone"
            type="tel"
            required
            value={primary.phone}
            onChange={(e) =>
              setPrimary((p) => ({ ...p, phone: e.target.value }))
            }
          />
        </div>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Street address
          </span>
          <textarea
            required
            rows={3}
            value={primary.address}
            onChange={(e) =>
              setPrimary((p) => ({ ...p, address: e.target.value }))
            }
            className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            placeholder="Street, city, state, ZIP"
          />
        </label>
      </section>

      {showSpouse ? (
        <section className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm md:p-8">
          <h2 className="font-display text-lg font-semibold text-ink">Spouse</h2>
          <p className="mt-1 text-sm text-ink-muted">Name and age only.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              required
              value={spouse.fullName}
              onChange={(e) =>
                setSpouse((s) => ({ ...s, fullName: e.target.value }))
              }
            />
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
                Age
              </span>
              <input
                type="number"
                min={18}
                max={120}
                required
                value={spouse.age}
                onChange={(e) =>
                  setSpouse((s) => ({
                    ...s,
                    age: Math.min(
                      120,
                      Math.max(18, Number(e.target.value) || 18)
                    ),
                  }))
                }
                className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </label>
          </div>
        </section>
      ) : null}

      {showSpouse ? (
        <section className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                Children (ages 12–20)
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Name and age for each dependent child on the family plan.
              </p>
            </div>
            <button
              type="button"
              onClick={addChild}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90"
            >
              Add child
            </button>
          </div>
          {children.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              No children added. You can still submit if only adults are on the
              plan.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {children.map((row, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-surface-border bg-white p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">
                      Child {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChild(i)}
                      className="text-sm text-ink-muted hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Full name"
                      required
                      value={row.fullName}
                      onChange={(e) =>
                        updateChild(i, { fullName: e.target.value })
                      }
                    />
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
                        Age
                      </span>
                      <input
                        type="number"
                        min={12}
                        max={20}
                        required
                        value={row.age}
                        onChange={(e) =>
                          updateChild(i, {
                            age: Math.min(
                              20,
                              Math.max(12, Number(e.target.value) || 12)
                            ),
                          })
                        }
                        className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm md:p-8">
        <h2 className="font-display text-lg font-semibold text-ink">
          Payment method
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Card number, cardholder name, expiration (MM/YY), CVV, and billing ZIP
          for the card.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              label="Card number"
              inputMode="numeric"
              autoComplete="cc-number"
              required
              value={payment.cardNumber}
              onChange={(e) =>
                setPayment((p) => ({ ...p, cardNumber: e.target.value }))
              }
              placeholder="1234 5678 9012 3456"
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Name on card"
              autoComplete="cc-name"
              required
              value={payment.cardholderName}
              onChange={(e) =>
                setPayment((p) => ({ ...p, cardholderName: e.target.value }))
              }
            />
          </div>
          <Field
            label="Expiration (MM/YY)"
            autoComplete="cc-exp"
            required
            value={payment.expiration}
            onChange={(e) =>
              setPayment((p) => ({
                ...p,
                expiration: e.target.value.toUpperCase(),
              }))
            }
            placeholder="12/28"
          />
          <Field
            label="CVV"
            inputMode="numeric"
            autoComplete="cc-csc"
            required
            maxLength={4}
            value={payment.cvv}
            onChange={(e) =>
              setPayment((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "") }))
            }
          />
          <Field
            label="Billing ZIP"
            autoComplete="postal-code"
            required
            value={payment.billingZip}
            onChange={(e) =>
              setPayment((p) => ({ ...p, billingZip: e.target.value }))
            }
            placeholder="12345 or 12345-6789"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm md:p-8">
        <h2 className="font-display text-lg font-semibold text-ink">
          Agreements — read and initial each section
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Your initials confirm you have read and agree to each section.
        </p>
        <div className="mt-6 space-y-6">
          {agreementBlocks.map((block) => (
            <div
              key={block.key}
              className="rounded-xl border border-surface-border bg-white p-4 md:p-5"
            >
              <h3 className="font-medium text-ink">{block.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {block.body}
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="block w-28">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
                    Initials
                  </span>
                  <input
                    required
                    maxLength={8}
                    autoComplete="off"
                    value={agreementInitials[block.key]}
                    onChange={(e) =>
                      setAgreementInitials((a) => ({
                        ...a,
                        [block.key]: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full rounded-lg border border-surface-border px-3 py-2 text-center text-sm font-semibold uppercase tracking-widest text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm md:p-8">
        <h2 className="font-display text-lg font-semibold text-ink">
          Printed name, signature, and date
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Sign below. The printed name and date should match how you are agreeing
          to this application today.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Printed name"
            required
            value={printedName}
            onChange={(e) => setPrintedName(e.target.value)}
            placeholder="Your name as printed on this agreement"
          />
          <Field
            label="Date"
            type="date"
            required
            value={agreementDate}
            onChange={(e) => setAgreementDate(e.target.value)}
          />
        </div>
        <div className="mt-6">
          <SignaturePad
            ref={sigRef}
            label="Signature"
            hint="Electronic signature — same effect as signing on paper."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm md:p-8">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Notes (optional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            placeholder="Anything else we should know…"
          />
        </label>
      </section>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
