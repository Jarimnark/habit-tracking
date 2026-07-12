import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionToken } from "./session-token";

/** Whether the current request carries a valid session cookie. */
export async function isAuthed(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return !!token && token === (await sessionToken());
}
