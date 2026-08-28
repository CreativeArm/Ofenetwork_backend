import { Suspense } from "react";
import { Reveal, Stagger, StaggerItem } from "../../components/homepage-motion";
import { PublicShell } from "../../components/public-shell";
import { ResetPasswordForm } from "../../components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <PublicShell>
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal mode="load" className="h-full">
          <div className="relative h-full overflow-hidden rounded-[32px] bg-[#0d2e1e] p-8 text-white shadow-[0_24px_60px_rgba(13,46,30,0.25)] transition-transform duration-500 hover:-translate-y-1">
            <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-12">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  New Password
                </span>

                <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white">
                  Create a fresh password and continue securely.
                </h1>

                <p className="mt-4 text-sm leading-7 text-emerald-100/70">
                  Once your password changes, old refresh sessions are cleared
                  so the new password becomes the only way back in.
                </p>
              </div>

              <Stagger className="flex flex-wrap gap-2">
                {[
                  "Token Verified",
                  "Old Sessions Cleared",
                  "Protected Reset",
                  "Fast Sign In",
                ].map((item) => (
                  <StaggerItem key={item}>
                    <span className="rounded-full border border-emerald-600/30 bg-emerald-800/40 px-3 py-1 text-xs font-medium text-emerald-200">
                      {item}
                    </span>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
        </Reveal>

        <Suspense fallback={<div className="rounded-[32px] border border-[#e7eee9] bg-white p-8 shadow-[0_12px_30px_rgba(15,23,32,0.06)]"><p className="text-sm text-slate-500">Loading reset form...</p></div>}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </PublicShell>
  );
}
