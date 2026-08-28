import { ForgotPasswordForm } from "../../components/forgot-password-form";
import { Reveal, Stagger, StaggerItem } from "../../components/homepage-motion";
import { PublicShell } from "../../components/public-shell";

export default function ForgotPasswordPage() {
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
                  Account Recovery
                </span>

                <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white">
                  Get back into your OFENetworks workspace safely.
                </h1>

                <p className="mt-4 text-sm leading-7 text-emerald-100/70">
                  Reset links are time-limited and single-use, so your account
                  stays protected while you recover access.
                </p>
              </div>

              <Stagger className="flex flex-wrap gap-2">
                {[
                  "Secure Tokens",
                  "30 Minute Expiry",
                  "Session Cleanup",
                  "Simple Recovery",
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

        <ForgotPasswordForm />
      </section>
    </PublicShell>
  );
}
