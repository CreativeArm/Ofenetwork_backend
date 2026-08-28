import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "../../components/homepage-motion";
import { PublicShell } from "../../components/public-shell";

const termsSections = [
  {
    title: "Using OFENetworks",
    text: "You may use OFENetworks to submit supported service requests, view rates, upload transaction proof, request Buy4Me assistance, and manage your account. You must provide accurate information and use the platform only for lawful purposes.",
  },
  {
    title: "Account responsibility",
    text: "Keep your login details private and notify us promptly if you suspect unauthorised access. You are responsible for activity completed through your account until you report a security concern to our support team.",
  },
  {
    title: "Rates and quotes",
    text: "Displayed rates and Buy4Me quotes may change before a transaction is confirmed. The rate or quote shown in the relevant service workspace at the time of your submitted request is the one our team reviews.",
  },
  {
    title: "Manual review and processing",
    text: "Deposits, withdrawals, Buy4Me orders, KYC submissions, and uploaded payment proof may require manual review. Processing times can vary where information is incomplete, payment proof cannot be verified, or additional checks are needed.",
  },
  {
    title: "Prohibited activity",
    text: "Do not use the platform for fraud, money laundering, unauthorised payments, false documentation, abusive conduct, or any activity that violates applicable law. We may suspend or restrict an account while investigating suspected misuse.",
  },
  {
    title: "Support and changes",
    text: "If you need help with a request, contact support through the platform. We may update these terms when our services, processes, or legal requirements change. Continued use after an update means you accept the revised terms.",
  },
] as const;

export default function TermsPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl">
        <Reveal mode="load">
          <div className="overflow-hidden rounded-[34px] border border-[#e4ece7] bg-[linear-gradient(135deg,#f8fbf9_0%,#eef8f1_48%,#ffffff_100%)] p-6 shadow-[0_22px_60px_rgba(15,23,32,0.06)] sm:p-10 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Terms of Service</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              The terms for using OFENetworks services
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              These terms explain how our account, transaction, rate, and Buy4Me services work. Please read them before creating an account or submitting a request.
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Last updated: August 18, 2026</p>
          </div>
        </Reveal>

        <Stagger className="mt-8 grid gap-4">
          {termsSections.map((section) => (
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
            <h2 className="text-xl font-semibold text-slate-950">Questions about these terms?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">Our support team can clarify how these terms apply to a service request or your account.</p>
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
