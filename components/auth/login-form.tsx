"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setError(null);

          const { error } = await supabase.auth.signInWithPassword({
            email: String(formData.get("email")),
            password: String(formData.get("password")),
          });

          if (error) {
            setError(error.message ?? "Unable to sign in.");
            return;
          }

          router.push(redirectTo);
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none ring-0 transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          id="email"
          name="email"
          type="email"
          defaultValue="admin@5999cargo.local"
          required
        />
        <p className="text-xs leading-5 text-slate-500">
          Use the email linked to your Supabase auth account.
        </p>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="password"
        >
          Password
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none ring-0 transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          id="password"
          name="password"
          type="password"
          defaultValue="ChangeMe123!"
          required
        />
        <p className="text-xs leading-5 text-slate-500">
          The seeded admin password is available in your environment config.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        className="w-full rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
