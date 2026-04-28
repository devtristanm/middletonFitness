import type { MembershipRecord, MembershipType } from "@/lib/types";

/** Published monthly rates (Middleton Fitness Center) */
export const INDIVIDUAL_MONTHLY_USD = 39.99;
export const FAMILY_MONTHLY_USD = 89.99;

export function monthlyRateUsd(type: MembershipType): number {
  return type === "family" ? FAMILY_MONTHLY_USD : INDIVIDUAL_MONTHLY_USD;
}

export type RevenueBreakdown = {
  totalUsd: number;
  individualUsd: number;
  familyUsd: number;
  individualCount: number;
  familyCount: number;
};

export function sumMonthlyRevenue(records: MembershipRecord[]): RevenueBreakdown {
  let individualUsd = 0;
  let familyUsd = 0;
  let individualCount = 0;
  let familyCount = 0;
  for (const m of records) {
    if (m.type === "family") {
      familyCount += 1;
      familyUsd += FAMILY_MONTHLY_USD;
    } else {
      individualCount += 1;
      individualUsd += INDIVIDUAL_MONTHLY_USD;
    }
  }
  return {
    totalUsd: individualUsd + familyUsd,
    individualUsd,
    familyUsd,
    individualCount,
    familyCount,
  };
}

export function formatUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
