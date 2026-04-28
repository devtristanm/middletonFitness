import { migrateMembershipRecord } from "./migrateMembershipRecord";
import { createMembershipSupabaseClient } from "./supabase/server";
import type { MembershipRecord, MembershipsFile } from "./types";

const STORE_ROW_ID = 1;

const defaultFile = (): MembershipsFile => ({
  nextId: 1280,
  memberships: [],
});

function normalizeStore(raw: unknown): MembershipsFile {
  if (!raw || typeof raw !== "object") return defaultFile();
  const o = raw as MembershipsFile;
  if (typeof o.nextId !== "number" || !Array.isArray(o.memberships)) {
    return defaultFile();
  }
  return o;
}

export async function readStore(): Promise<MembershipsFile> {
  const supabase = createMembershipSupabaseClient();
  const { data: row, error } = await supabase
    .from("membership_store")
    .select("data")
    .eq("id", STORE_ROW_ID)
    .maybeSingle();

  if (error) {
    console.error("membership_store read:", error.code, error.message, error.details);
    throw error;
  }
  if (!row?.data) return defaultFile();
  return normalizeStore(row.data);
}

async function writeStore(data: MembershipsFile) {
  const supabase = createMembershipSupabaseClient();
  const { error } = await supabase.from("membership_store").upsert(
    {
      id: STORE_ROW_ID,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function listMemberships(): Promise<MembershipRecord[]> {
  const store = await readStore();
  return [...store.memberships]
    .map((m) => migrateMembershipRecord(m as MembershipRecord))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function getMembership(
  membershipId: number
): Promise<MembershipRecord | null> {
  const store = await readStore();
  const found = store.memberships.find((m) => m.membershipId === membershipId);
  return found ? migrateMembershipRecord(found as MembershipRecord) : null;
}

export async function addMembership(
  record: Omit<
    MembershipRecord,
    | "membershipId"
    | "createdAt"
    | "updatedAt"
    | "cancelledAt"
    | "lastSheetEditAt"
    | "ownerNotes"
  >
): Promise<MembershipRecord> {
  const store = await readStore();
  const membershipId = store.nextId;
  const now = new Date().toISOString();
  const full: MembershipRecord = {
    ...record,
    membershipId,
    createdAt: now,
    updatedAt: now,
    cancelledAt: null,
    lastSheetEditAt: null,
    ownerNotes: "",
  };
  store.memberships.push(full);
  store.nextId = membershipId + 1;
  await writeStore(store);
  return full;
}

export async function updateMembership(
  membershipId: number,
  patch: Partial<Omit<MembershipRecord, "membershipId" | "createdAt">>
): Promise<MembershipRecord | null> {
  const store = await readStore();
  const idx = store.memberships.findIndex((m) => m.membershipId === membershipId);
  if (idx === -1) return null;
  const prev = store.memberships[idx];
  const base = migrateMembershipRecord(prev as MembershipRecord);
  const updated: MembershipRecord = {
    ...base,
    ...patch,
    membershipId: base.membershipId,
    createdAt: base.createdAt,
    updatedAt: new Date().toISOString(),
  };
  store.memberships[idx] = updated;
  await writeStore(store);
  return updated;
}
