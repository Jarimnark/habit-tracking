import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session-token";
import "./globals.css";

export const metadata: Metadata = {
  title: "Habits",
  description: "Personal habit tracker",
};

async function signOut() {
  "use server";
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authed = await isAuthed();

  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-2xl px-4 py-6">
          {authed && (
            <header className="mb-8 flex items-center justify-between">
              <nav className="flex items-center gap-5 text-sm font-medium">
                <Link href="/" className="hover:underline">
                  Today
                </Link>
                <Link href="/dashboard" className="hover:underline">
                  Dashboard
                </Link>
                <Link href="/habits" className="hover:underline">
                  Habits
                </Link>
              </nav>
              <form action={signOut}>
                <button className="text-sm text-stone-500 hover:underline">
                  Sign out
                </button>
              </form>
            </header>
          )}
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
