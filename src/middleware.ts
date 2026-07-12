import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionToken } from "@/lib/session-token";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && token === (await sessionToken())) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Protect everything except the login page, static assets, the service
  // worker, and the cron endpoint (which authenticates via CRON_SECRET).
  matcher: ["/((?!login|api/cron|sw\\.js|_next/static|_next/image|favicon.ico).*)"],
};
