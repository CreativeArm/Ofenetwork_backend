import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "../../components/homepage-motion";
import { AppShell } from "../../components/shell";
import { Icon } from "../../components/icons";
import { ServiceIcon } from "../../components/service-icon";
import { LiveRatesSnapshot } from "../../components/live-rates-snapshot";
import { BonusBalanceAmount } from "../../components/bonus-balance";
import { BonusCashoutPanel } from "../../components/bonus-cashout-panel";
import { DashboardQuickStats } from "../../components/dashboard-quick-stats";
import { UserTransactionHistory } from "../../components/user-transaction-history";
import { serviceConfigs } from "../../lib/mock-data";

const onboardingSteps = [
  {
    title: "Choose a service",
    text: "Open Deriv, Crypto, Skrill, PayPal, Zelle, Payoneer, or Buy4Me from your sidebar.",
  },
  {
    title: "Submit proof or details",
    text: "Follow the guided deposit or withdrawal form and upload your proof where required.",
  },
  {
    title: "Wait for confirmation",
    text: "Our admin team verifies your request and updates the status in your transaction log.",
  },
];

const supportHighlights = [
  "Admin-reviewed transactions for added control",
  "Manual referral and threshold bonuses after qualified transactions",
  "Transparent rates and clear proof-upload flow",
  "Buy4Me ordering for products outside Nigeria",
];

export default function DashboardPage() {
  return (
    <AppShell
      activeSlug="dashboard"
      title="Dashboard"
      subtitle="See your bonus, services, rates, and transaction updates at a glance."
    >
      <section className="min-w-0 space-y-6">
        <Stagger className="grid gap-4 sm:gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <StaggerItem>
          <div className="min-w-0 rounded-[26px] bg-[linear-gradient(135deg,#123b27,#0f7b36)] p-5 text-white shadow-[0_20px_60px_rgba(15,123,54,0.18)] transition-all duration-300 hover:shadow-[0_24px_70px_rgba(15,123,54,0.22)] sm:rounded-[30px] sm:p-7">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">OFENetworks Hub</p>
            <h2 className="mt-4 max-w-xl text-2xl font-semibold leading-tight sm:text-4xl">
              Manage funding, withdrawals, digital payments, and Buy4Me requests from one clean workspace.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/85">
              This dashboard is your control center. Review your bonus progress, explore supported services, track
              pending actions, and move into the exact workflow you need without digging through the app.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services/deriv" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#123b27]">
                Start a transaction
              </Link>
              <Link href="/dashboard/buy4me" className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white">
                Open Buy4Me
              </Link>
            </div>
          </div>
          </StaggerItem>

          <DashboardQuickStats />
        </Stagger>

        <Stagger className="grid gap-4 sm:gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <StaggerItem>
          <div className="min-w-0 rounded-[26px] border border-[#e6ece8] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)] sm:rounded-[30px] sm:p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">Explore Services</h3>
                <p className="mt-1 text-sm text-slate-500">Jump into the exact workflow you need with service-specific pages.</p>
              </div>
              <p className="text-sm font-medium text-[#0f7b36]">
                Bonus Balance: <BonusBalanceAmount />
              </p>
            </div>

            <Stagger className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {serviceConfigs.map((service) => (
                <StaggerItem key={service.slug}>
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="group relative block overflow-hidden rounded-[24px] border border-[#e7ece8] bg-[#fcfdfc] p-5 transition-all duration-500 hover:-translate-y-1.5 hover:border-emerald-100 hover:shadow-[0_22px_48px_rgba(15,123,54,0.09)]"
                >
                  <span className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-100/60 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="flex items-start justify-between gap-3">
                    <span className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:scale-105 ${service.accent}`}>
                      <ServiceIcon name={service.slug} className="h-7 w-7 object-contain" />
                    </span>
                    <span className="rounded-full bg-[#f1f7f2] px-3 py-1 text-xs font-semibold text-[#0f7b36]">
                      Open
                    </span>
                  </div>
                  <h4 className="mt-5 text-xl font-semibold text-slate-900">{service.name}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{service.description}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#0f7b36]">
                    Continue
                    <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
                </StaggerItem>
              ))}
              <StaggerItem>
              <Link
                href="/dashboard/buy4me"
                className="group relative block overflow-hidden rounded-[24px] border border-[#e7ece8] bg-[#fcfdfc] p-5 transition-all duration-500 hover:-translate-y-1.5 hover:border-emerald-100 hover:shadow-[0_22px_48px_rgba(15,123,54,0.09)]"
              >
                <span className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-100/60 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-3">
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 transition-transform duration-500 group-hover:scale-105">
                    <ServiceIcon name="buy4me" className="h-7 w-7 object-contain" />
                  </span>
                  <span className="rounded-full bg-[#f1f7f2] px-3 py-1 text-xs font-semibold text-[#0f7b36]">
                    Popular
                  </span>
                </div>
                <h4 className="mt-5 text-xl font-semibold text-slate-900">Buy4Me</h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Need us to purchase, ship, and deliver a product for you? Start and manage the full order flow here.
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#0f7b36]">
                  Open Buy4Me
                  <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
              </StaggerItem>
            </Stagger>
          </div>
          </StaggerItem>

          <Stagger className="space-y-6">
            <StaggerItem>
            <div className="rounded-[30px] border border-[#e6ece8] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)]">
              <h3 className="text-2xl font-semibold text-slate-900">How It Works</h3>
              <div className="mt-5 space-y-5">
                {onboardingSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-[#0f7b36]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </StaggerItem>

            <StaggerItem>
            <div className="rounded-[30px] bg-[#123b27] p-6 text-white shadow-[0_18px_45px_rgba(15,123,54,0.16)] transition-all duration-300 hover:shadow-[0_22px_55px_rgba(15,123,54,0.2)]">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Why users stay</p>
              <div className="mt-5 space-y-4">
                {supportHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="rounded-full bg-white/10 p-1.5 text-emerald-200">
                      <Icon name="check" className="h-4 w-4" />
                    </span>
                    <p className="text-sm leading-6 text-emerald-50/90">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            </StaggerItem>
          </Stagger>
        </Stagger>

        <Stagger className="grid gap-4 sm:gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <StaggerItem>
          <LiveRatesSnapshot />
          </StaggerItem>

          <StaggerItem>
            <UserTransactionHistory />

            <Reveal className="mt-6" delay={0.08}>
              <BonusCashoutPanel />
            </Reveal>
          </StaggerItem>
        </Stagger>
      </section>
    </AppShell>
  );
}
