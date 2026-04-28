import { promises as fs } from "fs";
import path from "path";
import { migrateMembershipRecord } from "./migrateMembershipRecord";
import type { MembershipRecord, MembershipsFile } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "memberships.json");

const defaultFile = (): MembershipsFile => ({
  nextId: 1280,
  memberships: [],
});

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readStore(): Promise<MembershipsFile> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as MembershipsFile;
    if (
      typeof parsed.nextId !== "number" ||
      !Array.isArray(parsed.memberships)
    ) {
      return defaultFile();
    }
    return parsed;
  } catch {
    return defaultFile();
  }
}

async function writeStore(data: MembershipsFile) {
  await ensureDataDir();
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
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
