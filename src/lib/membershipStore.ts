import type { WithId, Document } from "mongodb";
import {
  getDb,
  ensureMembershipIndexes,
  MONGO_COLLECTION_COUNTERS,
  MONGO_COLLECTION_MEMBERSHIPS,
  MONGO_COUNTER_MEMBERSHIP_ID,
} from "./mongo/db";
import { migrateMembershipRecord } from "./migrateMembershipRecord";
import type { MembershipRecord } from "./types";

function logMongo(context: string, err: unknown) {
  const e = err as { code?: number; message?: string };
  console.error(context, e.code ?? "", e.message ?? err);
}

function stripId<T extends Document>(doc: WithId<T> | null): (Omit<T, "_id"> & { _id?: never }) | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  void _id;
  return rest as Omit<T, "_id"> & { _id?: never };
}

async function nextMembershipId(): Promise<number> {
  const db = await getDb();
  const counters = db.collection<{ _id: string; seq: number }>(
    MONGO_COLLECTION_COUNTERS
  );
  await counters.updateOne(
    { _id: MONGO_COUNTER_MEMBERSHIP_ID },
    { $setOnInsert: { seq: 1279 } },
    { upsert: true }
  );
  await counters.updateOne(
    { _id: MONGO_COUNTER_MEMBERSHIP_ID },
    { $inc: { seq: 1 } }
  );
  const doc = await counters.findOne({ _id: MONGO_COUNTER_MEMBERSHIP_ID });
  const seq = doc?.seq;
  if (typeof seq !== "number") {
    throw new Error("Could not allocate membership id");
  }
  return seq;
}

export async function listMemberships(): Promise<MembershipRecord[]> {
  const db = await getDb();
  await ensureMembershipIndexes(db);
  const col = db.collection<MembershipRecord & Document>(
    MONGO_COLLECTION_MEMBERSHIPS
  );
  const cursor = col.find({}).sort({ createdAt: -1 });
  const docs = await cursor.toArray();
  return docs.map((d) =>
    migrateMembershipRecord(stripId(d) as MembershipRecord)
  );
}

export async function getMembership(
  membershipId: number
): Promise<MembershipRecord | null> {
  const db = await getDb();
  await ensureMembershipIndexes(db);
  const col = db.collection<MembershipRecord & Document>(
    MONGO_COLLECTION_MEMBERSHIPS
  );
  const doc = await col.findOne({ membershipId });
  if (!doc) return null;
  return migrateMembershipRecord(stripId(doc) as MembershipRecord);
}

type NewMembershipInput = Omit<
  MembershipRecord,
  | "membershipId"
  | "createdAt"
  | "updatedAt"
  | "cancelledAt"
  | "lastSheetEditAt"
  | "ownerNotes"
>;

export async function addMembership(
  record: NewMembershipInput
): Promise<MembershipRecord> {
  const db = await getDb();
  await ensureMembershipIndexes(db);
  const membershipId = await nextMembershipId();
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

  const col = db.collection<MembershipRecord & Document>(
    MONGO_COLLECTION_MEMBERSHIPS
  );
  const plain = JSON.parse(JSON.stringify(full)) as MembershipRecord;
  try {
    await col.insertOne(plain as MembershipRecord & Document);
  } catch (err) {
    logMongo("memberships insert:", err);
    throw err;
  }
  return migrateMembershipRecord(plain);
}

export async function updateMembership(
  membershipId: number,
  patch: Partial<Omit<MembershipRecord, "membershipId" | "createdAt">>
): Promise<MembershipRecord | null> {
  const db = await getDb();
  await ensureMembershipIndexes(db);
  const col = db.collection<MembershipRecord & Document>(
    MONGO_COLLECTION_MEMBERSHIPS
  );
  const existingDoc = await col.findOne({ membershipId });
  if (!existingDoc) return null;

  const existing = migrateMembershipRecord(
    stripId(existingDoc) as MembershipRecord
  );
  const updated: MembershipRecord = {
    ...existing,
    ...patch,
    membershipId: existing.membershipId,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const plain = JSON.parse(JSON.stringify(updated)) as MembershipRecord;
  const rep = await col.replaceOne(
    { membershipId },
    plain as MembershipRecord & Document
  );
  if (rep.matchedCount === 0) return null;
  const next = await col.findOne({ membershipId });
  if (!next) return null;
  return migrateMembershipRecord(stripId(next) as MembershipRecord);
}
