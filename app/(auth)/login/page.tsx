import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getAuthenticatedUser } from "@/lib/dal";

export default async function LoginPage() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(180deg,#0b2234_0%,#10293d_54%,#eff4f7_54%,#f7fafc_100%)] px-4 py-8 md:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[36px] border border-white/12 bg-slate-950/50 p-8 text-white shadow-[0_30px_120px_rgba(8,47,73,0.45)] backdrop-blur md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            5999Cargo Internal
          </p>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Customs operations built for consolidations, invoices and control.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-200">
            Access the operational shell for consolidations, settings review
            and the upcoming import workflow.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Supabase sign-in",
              "Role-aware access",
              "Settings snapshot control",
              "Operational dashboard shell",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-sm text-slate-100"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-[560px] items-center rounded-[36px] border border-white/70 bg-white/96 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] md:p-10">
          <div className="mx-auto w-full max-w-md">
            <p className="text-sm font-medium text-cyan-700">Sign in</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Access customs dashboard
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sign in with your Supabase email and password. If your account also
              exists in the internal users table, your app role and organization
              access will be applied automatically.
            </p>
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
