import Image from "next/image";
import Link from "next/link";
import {
  Reveal,
  Stagger,
  StaggerItem,
} from "../../components/homepage-motion";
import { PublicShell } from "../../components/public-shell";
import { Icon } from "../../components/icons";
import buy4MeHero from "../../images/Buy4me_hero.png";
import {
  buy4MeCategories,
  buy4MeSteps,
  supportReasons,
} from "../../lib/mock-data";

export default function Buy4MePublicPage() {
  return (
    <PublicShell>
      <section className="space-y-8">
        <Stagger className="-mx-4 -mt-1 md:mx-auto md:px-4 md:py-8">
          <StaggerItem>
            <div className="relative overflow-hidden bg-[#072817] text-white shadow-[0_28px_80px_rgba(6,40,23,0.26)] md:rounded-[36px]">
              <Image
                src={buy4MeHero}
                alt="Cargo being loaded beside an aircraft for Buy4Me deliveries"
                fill
                priority
                className="object-cover object-center"
                sizes="(min-width: 1280px) 1280px, 100vw"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,39,22,0.96)_0%,rgba(5,39,22,0.92)_34%,rgba(7,47,28,0.78)_52%,rgba(7,47,28,0.42)_68%,rgba(7,47,28,0.16)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(75,245,188,0.14),transparent_34%)]" />

              <div className="relative grid min-h-[calc(100svh-104px)] items-center px-6 py-8 md:min-h-[560px] md:px-10 md:py-14 lg:min-h-[640px] lg:px-14 xl:px-16">
                <div className="max-w-2xl">
                  <span className="inline-flex rounded-full bg-[#083a23]/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#31d89b] shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                    Buy4Me Guest Access
                  </span>
                  <h1 className="mt-8 max-w-xl text-4xl font-bold leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-[4.45rem]">
                    Shop global products with clear{" "}
                    <span className="text-[#4ce5b5]">Buy4Me</span> quotes.
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg leading-[1.7] text-emerald-50/88 md:text-[1.75rem] md:leading-[1.55] md:tracking-[-0.03em]">
                    Share your product links, preview the guided process, and
                    receive transparent pricing breakdowns before payment.
                  </p>

                  <div className="mt-10 flex flex-wrap items-center gap-4">
                    <Link
                      href="/register"
                      className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#39dfb1] px-7 text-base font-semibold text-[#083121] shadow-[0_18px_40px_rgba(57,223,177,0.24)] transition-all duration-200 hover:bg-[#55ebbf] active:scale-[0.98]"
                    >
                      Create Account to Continue
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/16 bg-white/6 px-7 text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
                    >
                      Already have an account?
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </StaggerItem>
        </Stagger>

        <Reveal className="rounded-[34px] border border-[#e7eee9] bg-[#fbfdfb] p-4 shadow-[0_12px_30px_rgba(15,23,32,0.04)] md:p-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">
                Buy4Me Preview
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Visitors can learn how Buy4Me works here. Request submission,
                payment upload, pricing approval, and order tracking stay inside
                the user dashboard.
              </p>
            </div>
            <Link
              href="/register"
              className="rounded-2xl border border-[#cfe2d5] bg-white px-5 py-3 text-sm font-semibold text-[#0f7b36]"
            >
              Create Account to Start
            </Link>
          </div>

          <div className="space-y-5">
            <StaggerItem className="rounded-[28px] border border-[#e6ece8] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)]">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  "Submit your product links",
                  "Receive admin quote and total cost",
                  "Pay after account login",
                  "Track your order from dashboard",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-[#f6faf7] p-4 text-sm font-semibold text-slate-700"
                  >
                    <span className="rounded-full bg-white p-2 text-emerald-600">
                      <Icon name="check" className="h-4 w-4" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </StaggerItem>

            <Stagger className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
              <StaggerItem>
              <div className="rounded-[28px] border border-[#e6ece8] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f7b36] text-sm font-semibold text-white">
                    1
                  </span>
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900">
                      What logged-in users can do
                    </h3>
                    <p className="text-sm text-slate-500">
                      These actions are unlocked only after sign in.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {[
                    {
                      title: "Submit Request",
                      text: "Paste product links, add notes, and send a purchase request from your dashboard.",
                    },
                    {
                      title: "Review Quote",
                      text: "See the product cost, shipping, delivery, and total admin-confirmed price.",
                    },
                    {
                      title: "Upload Payment",
                      text: "Choose a payment method and upload your receipt for confirmation.",
                    },
                    {
                      title: "Track Order",
                      text: "Monitor pending, in-progress, and completed stages directly from your account.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[22px] border border-[#edf1ee] bg-[#fcfdfc] p-5"
                    >
                      <p className="font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.text}
                      </p>
                    </div>
                    ))}
                  </div>
                </div>
              </StaggerItem>

              <StaggerItem>
              <div className="rounded-[28px] border border-[#e6ece8] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,32,0.04)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      How It Works
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      A simple path from request to doorstep delivery.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                    <Icon name="bag" className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-5 space-y-4">
                  {buy4MeSteps.map((step, index) => (
                    <div key={step.title} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-[#0f7b36]">
                          {index + 1}
                        </span>
                        {index < buy4MeSteps.length - 1 ? (
                          <span className="mt-2 h-8 w-px bg-[#d9e5dc]" />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {step.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </StaggerItem>
            </Stagger>

            <Stagger className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <StaggerItem>
              <div className="rounded-[28px] border border-[#e6ece8] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,32,0.04)]">
                <h3 className="text-xl font-semibold text-slate-900">
                  We Can Help You Buy
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Popular categories we source from China and the United States.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {buy4MeCategories.slice(0, 6).map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl bg-[#f8fbf8] p-4 text-sm text-slate-700"
                    >
                      <span className="mt-0.5 rounded-full bg-white p-1.5 text-emerald-600">
                        <Icon name="check" className="h-3 w-3" />
                      </span>
                      <span className="font-medium">{item}</span>
                    </div>
                    ))}
                  </div>
                </div>
              </StaggerItem>

              <StaggerItem>
              <div className="rounded-[28px] bg-[#143a27] p-6 text-white shadow-[0_18px_40px_rgba(15,123,54,0.18)]">
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">
                  Why Choose Us
                </p>
                <h3 className="mt-3 text-3xl font-semibold leading-tight">
                  Transparent pricing, reliable updates, and support that stays
                  with your order.
                </h3>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {supportReasons.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl bg-white/5 p-4"
                    >
                      <span className="rounded-full bg-white/10 p-2 text-emerald-200">
                        <Icon name="check" className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-medium text-emerald-50">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/register"
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#143a27]"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                    >
                      Log In
                    </Link>
                  </div>
                </div>
              </StaggerItem>
            </Stagger>
          </div>
        </Reveal>
      </section>
    </PublicShell>
  );
}
