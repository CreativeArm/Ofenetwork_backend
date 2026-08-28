import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "../../components/homepage-motion";
import { PublicShell } from "../../components/public-shell";

const cookieSections = [
  {
    title: "What cookies are",
    text: "Cookies are small files stored by your browser that help websites remember settings and keep sessions working correctly. Similar local browser storage may be used for the same purpose.",
  },
  {
    title: "How we use them",
    text: "OFENetworks uses essential browser storage to support sign-in, account access, interface preferences, and service functionality. These features help keep your dashboard and transaction experience consistent.",
  },
  {
    title: "Essential functionality",
    text: "Some storage is needed for secure account sessions and core platform features. Disabling it may prevent you from logging in, keeping your session active, or using dashboard services as intended.",
  },
  {
    title: "Managing your preferences",
    text: "You can clear or block cookies through your browser settings. Browser controls differ by device and browser. If you clear essential storage, you may need to sign in again or reconfigure preferences.",
  },
  {
    title: "Updates to this policy",
    text: "We may update this policy when our technology or service practices change. The latest version will always be available on this page.",
  },
] as const;

export default function CookiesPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl">
        <Reveal mode="load">
          <div className="overflow-hidden rounded-[34px] border border-[#e4ece7] bg-[linear-gradient(135deg,#f8fbf9_0%,#eef8f1_48%,#ffffff_100%)] p-6 shadow-[0_22px_60px_rgba(15,23,32,0.06)] sm:p-10 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Cookie Policy</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              How OFENetworks uses browser storage
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              This policy explains how cookies and similar browser storage support account access and a reliable platform experience.
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Last updated: August 18, 2026</p>
          </div>
        </Reveal>

        <Stagger className="mt-8 grid gap-4">
          {cookieSections.map((section) => (
            <StaggerItem key={section.title}>
              <article className="rounded-[26px] border border-[#e7eee9] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,32,0.04)] sm:p-7">
                <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{section.text}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.12}>
          <div className="mt-8 rounded-[28px] border border-emerald-100 bg-emerald-50/70 p-6 sm:p-7">
            <h2 className="text-xl font-semibold text-slate-950">Need help with your privacy settings?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Contact support if you have questions about browser storage, cookies, or your account data.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/support" className="rounded-full bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d6b2f]">Contact Support</Link>
              <Link href="/privacy-policy" className="rounded-full border border-[#cddbd2] bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300">Privacy Policy</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </PublicShell>
  );
}
