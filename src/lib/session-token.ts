// Edge-safe (no Node APIs, no next/headers) so middleware can import it.

export const SESSION_COOKIE = "habit_session";

/**
 * The session cookie value: a SHA-256 digest derived from APP_PASSWORD.
 * Changing the password invalidates every existing session.
 */
export async function sessionToken(): Promise<string> {
  const password = process.env.APP_PASSWORD;
  if (!password) throw new Error("APP_PASSWORD is not set");
  const data = new TextEncoder().encode(`habit-tracker-session:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
