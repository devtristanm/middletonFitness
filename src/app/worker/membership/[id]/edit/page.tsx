"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MembershipForm } from "@/components/MembershipForm";
import { MiddletonLogo } from "@/components/MiddletonLogo";
import type {
  MembershipRecord,
  PaymentInfo,
  PersonInfo,
  SpouseInfo,
} from "@/lib/types";
import { brandPageShell } from "@/lib/siteChrome";

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

const shell = `${brandPageShell} px-4 py-10 md:py-12`;

export default function EditMembershipPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [record, setRecord] = useState<MembershipRecord | null | undefined>(
    undefined
  );

  const load = useCallback(async () => {
    const res = await fetch(`/api/memberships/${id}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRecord(null);
      return;
    }
    setRecord(data.membership as MembershipRecord);
  }, [id]);

  useEffect(() => {
    if (!Number.isInteger(id)) {
      setRecord(null);
      return;
    }
    load();
  }, [id, load]);

  if (record === undefined) {
    return (
      <div className={shell}>
        <div className="mx-auto mb-8 flex max-w-3xl justify-center">
          <MiddletonLogo size="sm" />
        </div>
        <p className="text-center text-sm text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className={shell}>
        <div className="mx-auto mb-8 flex max-w-3xl justify-center">
          <MiddletonLogo size="sm" />
        </div>
        <div className="mx-auto max-w-lg text-center">
          <p className="text-zinc-400">Sheet not found.</p>
          <Link
            href="/worker/dashboard"
            className="mt-4 inline-block text-sm text-accent hover:text-accent-hover"
          >
            ← Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <div className="mb-6 flex flex-col items-center gap-4">
            <MiddletonLogo size="lg" />
            <Link
              href={`/worker/membership/${id}`}
              className="text-sm font-medium text-zinc-400 transition hover:text-accent"
            >
              ← Back to sheet {id}
            </Link>
          </div>
          <h1 className="font-display text-3xl font-bold text-zinc-50">
            Edit membership {id}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">
            Correct any typos or wrong selections. Leave the signature blank to keep
            the current signature image.
          </p>
        </header>
        <MembershipForm
          mode="edit"
          submitLabel="Save changes"
          initial={{
            type: record.type,
            primary: record.primary ?? { ...emptyPrimary },
            spouse: record.spouse ?? { ...emptySpouse },
            children: record.children,
            payment: record.payment ?? { ...emptyPayment },
            agreementInitials: record.agreementInitials,
            printedName: record.printedName ?? "",
            agreementDate: record.agreementDate ?? "",
            notes: record.notes,
          }}
          onSubmit={async ({ values, signatureDataUrl }) => {
            const body: Record<string, unknown> = {
              type: values.type,
              primary: values.primary,
              spouse: values.type === "family" ? values.spouse : null,
              children: values.type === "family" ? values.children : [],
              payment: values.payment,
              agreementInitials: values.agreementInitials,
              printedName: values.printedName,
              agreementDate: values.agreementDate,
              notes: values.notes,
            };
            if (signatureDataUrl) {
              body.signatureDataUrl = signatureDataUrl;
            }
            const res = await fetch(`/api/memberships/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(data.error || "Could not save");
            }
            router.push(`/worker/membership/${id}`);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
