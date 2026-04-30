import { getMongoConnectionString } from "./db";

/**
 * Public signup on Vercel production requires a configured database.
 */
export function isProductionWithoutMongoUri(): boolean {
  return (
    process.env.VERCEL_ENV === "production" && !getMongoConnectionString()
  );
}
