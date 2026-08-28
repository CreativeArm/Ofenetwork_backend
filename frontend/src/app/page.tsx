import Image from "next/image";
import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "../components/homepage-motion";
import { Icon } from "../components/icons";
import { PublicShell } from "../components/public-shell";
import { ServiceIcon, type ServiceIconName } from "../components/service-icon";
import { LiveRatesTable } from "../components/live-rates-table";
import { LiveRatesBoard } from "../components/live-rates-board";
import { TestimonialsCarousel } from "../components/testimonials-carousel";
import { homeOffers, testimonials } from "../lib/mock-data";
import { fetchTestimonials } from "../lib/admin-backend";
import heroBackground from "../images/Hero_background.png";

export default async function HomePage() {
  const approvedTestimonials = await fetchTestimonials("APPROVED")
    .then((items) =>
      items.map((item) => ({
        name: item.name,
        badge: item.service,
        quote: item.text,
      })),
    )
    .catch(() => testimonials);
  const testimonialItems =
    approvedTestimonials.length > 0 ? approvedTestimonials : testimonials;

  return (
    <PublicShell>
      <section className="relative left-1/2 right-1/2 w-screen max-w-none -translate-x-1/2 overflow-hidden bg-white px-5 py-10 lg:-mt-[112px] lg:bg-[#f8faf8] lg:px-0 lg:pb-0 lg:pt-[112px]">
        <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
          <Image
            src={heroBackground}
            alt=""
            fill
            priority
            quality={72}
            sizes="100vw"
            className="object-contain object-right"
          />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 lg:min-h-[620px] lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <Reveal mode="load">
            <div className="relative z-10 mx-auto max-w-[620px] text-center lg:mx-0 lg:max-w-2xl lg:text-left">
              <div className="inline-flex w-full max-w-[320px] items-center justify-center rounded-full  px-5 py-2 text-sm font-medium text-[#007a61] sm:max-w-[420px] sm:text-lg lg:w-auto lg:max-w-none lg:justify-start  lg:px-4 lg:text-sm lg:text-emerald-700">
                Welcome to Ofenetworks Solutions
                <span className="hidden lg:inline">+</span>
              </div>
              <h1 className="mx-auto mt-7 max-w-[560px] text-[2.65rem] font-bold leading-[1.02] tracking-[-0.075em] text-[#2f2f31] min-[390px]:text-[2.9rem] sm:text-[4.25rem] lg:mx-0 lg:mt-6 lg:max-w-xl lg:text-7xl lg:font-extrabold lg:leading-[1.02] lg:tracking-[-0.05em] lg:text-slate-900 xl:text-8xl">
                <span className="block lg:inline">Your Trusted</span>{" "}
                <span className="block lg:inline">Hub For</span>{" "}
                <span className="block text-[#0f7b36] lg:inline">
                  Digital Finance
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-[380px] text-base leading-5 text-[#202020] sm:max-w-[520px] sm:text-2xl sm:leading-7 lg:mx-0 lg:mt-5 lg:max-w-xl lg:text-lg lg:leading-8 lg:text-slate-600">
                Buy, sell, swap and manage your digital assets securely with
                speed, ease and reliability.
              </p>
              <div className="mx-auto mt-8 grid max-w-[380px] grid-cols-2 gap-3 sm:max-w-[455px] sm:gap-5 lg:mx-0 lg:flex lg:max-w-none lg:flex-wrap">
                <Link
                  href="/dashboard"
                  className="rounded-full bg-[#07872f] px-4 py-3 text-center text-sm font-medium text-white sm:py-3 sm:text-lg lg:rounded-2xl lg:px-6 lg:py-3.5 lg:text-sm lg:font-semibold"
                >
                  Get Started
                </Link>
                <Link
                  href="/services"
                  className="rounded-full border border-[#d9d9d9] bg-white px-4 py-3 text-center text-sm font-medium text-[#4a4a4a] sm:py-3 sm:text-lg lg:rounded-2xl lg:border-[#d7e2db] lg:px-6 lg:py-3.5 lg:text-sm lg:font-semibold lg:text-slate-700"
                >
                  Explore Services
                </Link>
              </div>
              <div className="mx-auto mt-8 flex max-w-[520px] flex-wrap items-center justify-center gap-x-4 gap-y-3 text-xs text-[#787878] sm:mt-10 sm:flex-nowrap md:pb-20 sm:gap-5 sm:text-base lg:mx-0 lg:max-w-none lg:justify-start lg:gap-8 lg:text-sm lg:text-slate-600">
                {[
                  "Secure & Reliable",
                  "Instant Transactions",
                  "24/7 Support",
                ].map((item) => (
                  <div key={item} className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d5f8df] text-[#00a876] sm:h-6 sm:w-6 lg:h-auto lg:w-auto lg:bg-emerald-50 lg:p-2 lg:text-emerald-600">
                      <Icon
                        name="check"
                        className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4"
                      />
                    </span>
                    <span className="whitespace-nowrap">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative left-1/2 right-1/2 mt-0 w-screen max-w-none -translate-x-1/2 overflow-hidden border-y border-[#e8f1eb] bg-[linear-gradient(180deg,#f8fcf9_0%,#eff7f1_100%)] py-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:py-18">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0f7b36]">
              Live Market Rates
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Real-time Exchange & Asset Prices
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
              Track live deposit and withdrawal rates across all our crypto, forex, e-wallets, and global services. Compare rates at a glance and start trading instantly.
            </p>
          </Reveal>

          <Reveal className="mt-8 md:mt-12" delay={0.08}>
            <LiveRatesTable />
          </Reveal>
        </div>
      </section>

      <section className="relative left-1/2 right-1/2 mt-0 w-screen max-w-none -translate-x-1/2 overflow-hidden bg-[radial-gradient(circle_at_12%_18%,rgba(15,123,54,0.08),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7fbf8_55%,#ffffff_100%)] px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0f7b36]">
                What we offer
              </p>
              <h2 className="mt-3 max-w-xl text-2xl font-semibold leading-tight text-slate-900 md:text-5xl">
                Start with one service. Expand into a complete digital finance
                flow.
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-500">
                Funding, swaps, payouts, and assisted purchases designed to move
                at your pace.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex w-fit items-center gap-2 rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(17,17,17,0.18)]"
            >
              Explore services
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </Reveal>

          <Stagger className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.85fr]">
            <StaggerItem>
              <article className="overflow-hidden rounded-[30px] border border-[#e7eee9] bg-[linear-gradient(180deg,#ffffff_0%,#f4f7f5_100%)] shadow-[0_18px_40px_rgba(15,23,32,0.05)]">
                <div className="p-7">
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                      <Icon name="grid" className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Core access
                    </p>
                  </div>
                  <h3 className="mt-6 max-w-xs text-2xl font-semibold leading-tight text-slate-900">
                    Every tool you need, ready when you are.
                  </h3>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500">
                    Move from one-off transactions to a dependable everyday
                    workflow with services built for speed, clarity, and
                    support.
                  </p>
                </div>

                <div className="border-t border-[#e8ede9] bg-[#eef3ef] p-4 sm:p-5">
                  <Stagger className="mt-5 grid grid-cols-2 gap-3">
                    {homeOffers.slice(0, 4).map((offer) => (
                      <StaggerItem key={offer.title}>
                        <div className="group h-full rounded-[20px] bg-white p-3 shadow-[0_10px_24px_rgba(15,23,32,0.05)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,123,54,0.1)] sm:rounded-[24px] sm:p-4">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform duration-500 group-hover:scale-105 sm:h-12 sm:w-12">
                            {offer.icon === "grid" ? (
                              <Icon
                                name="grid"
                                className="h-4 w-4 sm:h-5 sm:w-5"
                              />
                            ) : (
                              <ServiceIcon
                                name={offer.icon as ServiceIconName}
                                className="h-5 w-5 object-contain sm:h-6 sm:w-6"
                              />
                            )}
                          </span>
                          <p className="mt-3 text-xs font-semibold text-slate-900 sm:mt-4 sm:text-sm">
                            {offer.title}
                          </p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:text-xs">
                            {offer.description}
                          </p>
                        </div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </div>
              </article>
            </StaggerItem>

            <Stagger className="grid gap-5 md:grid-cols-2">
              <StaggerItem className="md:col-span-2">
                <article className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#04140b_0%,#082517_48%,#0d3a24_100%)] p-7 text-white shadow-[0_20px_45px_rgba(4,20,11,0.28)] md:col-span-2">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(40,196,110,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(14,165,122,0.24),transparent_30%)]" />
                  <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:18px_18px]" />
                  <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
                        Connected workflow
                      </p>
                      <h3 className="mt-4 max-w-lg text-2xl md:4xl font-semibold leading-tight">
                        One dashboard for deposits, withdrawals, swaps, and
                        assisted orders.
                      </h3>
                      <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
                        Switch between services without losing context. Keep
                        your payments, rates, and support history in one
                        streamlined customer flow.
                      </p>
                    </div>

                    <div className="relative min-h-[240px] rounded-[26px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="absolute left-4 top-5 h-16 w-16 rounded-full bg-emerald-400/15 blur-2xl" />
                      <div className="absolute bottom-5 right-8 h-20 w-20 rounded-full bg-green-500/20 blur-2xl" />
                      <div className="relative flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="rounded-xl bg-white/10 p-2">
                              <Icon
                                name="swap"
                                className="h-4 w-4 text-emerald-200"
                              />
                            </span>
                            <div>
                              <p className="text-sm font-semibold">
                                Smart transaction flow
                              </p>
                              <p className="text-xs text-slate-300">
                                Choose service, confirm rate, upload proof
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                            Live
                          </span>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-300" />
                            <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-emerald-400 via-green-500 to-transparent" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                                Deposit
                              </p>
                              <p className="mt-3 text-sm md:text-lg font-semibold">
                                Fast funding
                              </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                                Withdrawal
                              </p>
                              <p className="mt-3 text-sm md:text-lg font-semibold">
                                Quick payout
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </StaggerItem>

              <StaggerItem className="h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-[30px] bg-[#5b0d0d] p-7 text-white shadow-[0_18px_40px_rgba(91,13,13,0.18)]">
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-white/10 p-3">
                      <Icon name="users" className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-100/80">
                      Human support
                    </p>
                  </div>
                  <h3 className="mt-6 text-2xl md:text-3xl font-semibold leading-tight">
                    One trusted place for guided transactions.
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-rose-50/80">
                    When a transfer needs confirmation or a purchase needs
                    review, our team steps in with clear status updates and
                    hands-on support.
                  </p>

                  <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
                    <div className="flex min-h-[114px] flex-col justify-between rounded-[24px] bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-rose-100/70">
                        Updates
                      </p>
                      <p className="text-sm font-semibold">Status tracking</p>
                    </div>
                    <div className="flex min-h-[114px] flex-col justify-between rounded-[24px] bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-rose-100/70">
                        Support
                      </p>
                      <p className="text-sm font-semibold">
                        Response when you need it
                      </p>
                    </div>
                  </div>
                </article>
              </StaggerItem>

              <StaggerItem className="h-full">
                <article className="relative flex h-full flex-col overflow-hidden rounded-[30px] bg-[#0d5f88] p-7 text-white shadow-[0_18px_40px_rgba(13,95,136,0.18)]">
                  <div className="absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-center gap-3">
                      <span className="rounded-2xl bg-white/10 p-3">
                        <ServiceIcon
                          name="buy4me"
                          className="h-5 w-5 object-contain"
                        />
                      </span>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100/80">
                        Buy 4 Me
                      </p>
                    </div>
                    <h3 className="mt-6 text-2xl md:text-3xl font-semibold leading-tight">
                      We shop, pay, and deliver when you can&apos;t do it
                      yourself.
                    </h3>
                    <p className="mt-4 max-w-xs text-sm leading-7 text-cyan-50/85">
                      Send us the product link, review your custom quote, and
                      let our team handle the payment and order process from
                      start to finish.
                    </p>

                    <Link
                      href="/buy4me"
                      className="mt-10 inline-flex w-fit rounded-full border-2 border-pink-300 px-5 py-3 text-md  font-medium tracking-[0.08em] text-white transition hover:bg-white/10"
                    >
                      SHOP FOR ME
                    </Link>
                  </div>
                </article>
              </StaggerItem>
            </Stagger>
          </Stagger>
        </div>
      </section>

      <section className="mt-12 rounded-[32px] border border-[#e7eee9] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)] p-6 shadow-[0_14px_40px_rgba(15,23,32,0.04)]">
        <Reveal className="text-center">
          <h2 className="text-3xl font-semibold text-slate-900">
            What Our Users Say
          </h2>
          <p className="mt-2 text-slate-500">
            Real reviews from real people who trust our services.
          </p>
        </Reveal>
        <TestimonialsCarousel items={testimonialItems} />
        <Stagger className="mt-8 grid gap-4 border-t border-[#eef2ef] pt-6 md:grid-cols-3">
          {[
            "Bank-Level Security",
            "Trusted by Thousands",
            "Built for Everyone",
          ].map((item) => (
            <StaggerItem key={item}>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <span className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                  <Icon name="check" className="h-4 w-4" />
                </span>
                {item}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </PublicShell>
  );
}
