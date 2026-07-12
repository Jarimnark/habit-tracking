import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Habits",
  description: "Personal habit tracker",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-2xl px-4 py-6">
          {session?.user && (
            <header className="mb-8 flex items-center justify-between">
              <nav className="flex items-center gap-5 text-sm font-medium">
                <Link href="/" className="hover:underline">
                  Today
                </Link>
                <Link href="/habits" className="hover:underline">
                  Habits
                </Link>
              </nav>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
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
