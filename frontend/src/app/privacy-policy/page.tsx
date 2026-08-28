import Link from "next/link";
import { PublicShell } from "../../components/public-shell";
import { Reveal, Stagger, StaggerItem } from "../../components/homepage-motion";

const policySections = [
  {
    title: "Information we collect",
    text:
      "We collect the information needed to create and secure your account, process transactions, review KYC submissions, respond to support requests, and keep service records accurate. This may include your name, email address, transaction details, uploaded proofs, KYC documents, profile photo, and support messages.",
  },
  {
    title: "How we use your information",
    text:
      "We use your information to provide OFENetworks services, calculate rates and payment instructions, review deposits and withdrawals, manage Buy4Me requests, communicate status updates, prevent misuse, and improve the reliability of the platform.",
  },
  {
    title: "Uploads and transaction proofs",
    text:
      "Files you upload, such as payment receipts, profile photos, or KYC documents, are used only for verification, support, and transaction processing. Admin users may review these files when required to confirm a request or resolve an issue.",
  },
  {
    title: "Sharing and disclosure",
    text:
      "We do not sell your personal information. We may share limited information with service providers who help us operate the platform, comply with legal obligations, prevent fraud, or complete a transaction you requested.",
  },
  {
    title: "Security",
    text:
      "We use access controls, secure password handling, audit records, and operational review processes to protect customer data. No online system is perfect, so you should also keep your login details private and report suspicious activity quickly.",
  },
  {
    title: "Your choices",
    text:
      "You can update your profile details, request support, or ask us to review information connected to your account. Some records may need to be kept for transaction history, security, accounting, or compliance reasons.",
  },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl">
        <Reveal mode="load">
          <div className="overflow-hidden rounded-[34px] border border-[#e4ece7] bg-[linear-gradient(135deg,#f8fbf9_0%,#eef8f1_48%,#ffffff_100%)] p-6 shadow-[0_22px_60px_rgba(15,23,32,0.06)] sm:p-10 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Privacy Policy
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              How OFENetworks handles your information
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              This policy explains what we collect, why we collect it, and how
              we protect information used across account funding, withdrawals,
              Buy4Me requests, support, KYC, and dashboard services.
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Last updated: June 14, 2026
            </p>
          </div>
        </Reveal>

        <Stagger className="mt-8 grid gap-4">
          {policySections.map((section) => (
            <StaggerItem key={section.title}>
              <article className="rounded-[26px] border border-[#e7eee9] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,32,0.04)] sm:p-7">
                <h2 className="text-xl font-semibold text-slate-950">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {section.text}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.12}>
          <div className="mt-8 rounded-[28px] border border-emerald-100 bg-emerald-50/70 p-6 sm:p-7">
            <h2 className="text-xl font-semibold text-slate-950">
              Contact us about privacy
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              If you have questions about this policy or your account data,
              contact us and our team will guide you through the next step.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/support"
                className="rounded-full bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d6b2f]"
              >
                Contact Support
              </Link>
              <Link
                href="/"
                className="rounded-full border border-[#cddbd2] bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300"
              >
                Back Home
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </PublicShell>
  );
}
