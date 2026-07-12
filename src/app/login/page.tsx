import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionToken } from "@/lib/session-token";

async function login(formData: FormData) {
  "use server";
  const password = formData.get("password")?.toString() ?? "";
  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) {
    redirect("/login?error=1");
  }
  (await cookies()).set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Habits</h1>
        <p className="mt-1 text-sm text-stone-500">Personal habit tracker</p>
      </div>
      <form action={login} className="flex flex-col items-center gap-3">
        <input
          name="password"
          type="password"
          required
          autoFocus
          placeholder="Password"
          className="w-64 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-stone-700 dark:bg-stone-900"
        />
        {error && <p className="text-sm text-red-500">Wrong password.</p>}
        <button className="w-64 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Sign in
        </button>
      </form>
    </div>
  );
}
