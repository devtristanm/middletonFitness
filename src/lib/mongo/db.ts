import { Db, MongoClient } from "mongodb";

const globalForMongo = globalThis as unknown as {
  mongoClientPromise: Promise<MongoClient> | undefined;
};

/**
 * Prefer MONGO_DB_CONNECTION_STRING; MONGODB_URI is a legacy alias.
 */
export function getMongoConnectionString(): string {
  return (
    process.env.MONGO_DB_CONNECTION_STRING?.trim() ||
    process.env.MONGODB_URI?.trim() ||
    ""
  );
}

function requireMongoUri(): string {
  const uri = getMongoConnectionString();
  if (!uri) {
    throw new Error(
      "Missing MongoDB connection string: set MONGO_DB_CONNECTION_STRING or MONGODB_URI (server-only)."
    );
  }
  return uri;
}

/**
 * Cached client for Next.js (avoids new connections every request in dev).
 */
export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = requireMongoUri();
  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo.mongoClientPromise = client.connect();
  }
  return globalForMongo.mongoClientPromise;
}

function dbNameFromUri(uri: string): string | null {
  const noQuery = uri.split(/[?#]/)[0] ?? uri;
  const at = noQuery.lastIndexOf("@");
  const tail = at >= 0 ? noQuery.slice(at + 1) : noQuery;
  const slash = tail.indexOf("/");
  if (slash < 0 || slash >= tail.length - 1) return null;
  const name = tail.slice(slash + 1).trim();
  if (!name) return null;
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

/** Database name: MONGODB_DB_NAME, or name after host in URI, or default. */
export async function getDb(): Promise<Db> {
  const client = await getMongoClientPromise();
  const fromEnv = process.env.MONGODB_DB_NAME?.trim();
  if (fromEnv) return client.db(fromEnv);
  const fromUri = dbNameFromUri(getMongoConnectionString());
  if (fromUri) return client.db(fromUri);
  return client.db("middleton_fitness");
}

let indexesEnsured = false;

export const MONGO_COLLECTION_MEMBERSHIPS = "memberships";
export const MONGO_COLLECTION_COUNTERS = "counters";
export const MONGO_COUNTER_MEMBERSHIP_ID = "memberships";

export async function ensureMembershipIndexes(db: Db): Promise<void> {
  if (indexesEnsured) return;
  const memberships = db.collection(MONGO_COLLECTION_MEMBERSHIPS);
  await memberships.createIndex({ membershipId: 1 }, { unique: true });

  const maxDoc = await memberships
    .find()
    .sort({ membershipId: -1 })
    .limit(1)
    .project({ membershipId: 1 })
    .next();
  const maxId = maxDoc?.membershipId ?? 1279;

  const counters = db.collection<{ _id: string; seq: number }>(
    MONGO_COLLECTION_COUNTERS
  );
  const cur = await counters.findOne({ _id: MONGO_COUNTER_MEMBERSHIP_ID });
  const seq = Math.max(cur?.seq ?? 1279, maxId);
  await counters.updateOne(
    { _id: MONGO_COUNTER_MEMBERSHIP_ID },
    { $set: { seq } },
    { upsert: true }
  );

  indexesEnsured = true;
}
