/** Cookie value derived from WORKER_PASSWORD (internal tool; set a strong password). */
export function workerSessionToken(secret: string): string {
  const payload = `ok:${secret}`;
  if (typeof Buffer !== "undefined") {
    return Buffer.from(payload, "utf-8").toString("base64url");
  }
  const bin = unescape(encodeURIComponent(payload));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
