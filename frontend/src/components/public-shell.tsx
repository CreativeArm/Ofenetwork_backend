"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { publicNavigation } from "../lib/mock-data";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { Icon } from "./icons";

interface PublicShellProps {
  children: ReactNode;
}

const mobileFooterGroups = [
  {
    title: "Explore",
    links: publicNavigation,
  },
  {
    title: "Services",
    links: [
      { label: "Deriv Funding", href: "/services/deriv" },
      { label: "Crypto Transactions", href: "/services/crypto" },
      { label: "Skrill and PayPal", href: "/services" },
      { label: "Buy4Me Orders", href: "/buy4me" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Create Account", href: "/register" },
      { label: "Log In", href: "/login" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Support", href: "/support" },
      { label: "Payment Support", href: "/support" },
      { label: "Customer Login", href: "/login" },
    ],
  },
];

export function PublicShell({ children }: PublicShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useBodyScrollLock(isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed left-0 right-0 top-0 z-30 border-b border-[#e7eee9] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <Link href="/" className="flex items-center">
            <Icon name="logo" className="h-6 w-auto" />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-xl border border-[#d8e3dc] px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[#0f7b36] px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Sign Up
            </Link>
          </div>
          <div className="relative md:hidden">
            <button
              type="button"
              aria-label={
                isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"
              }
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="flex items-center justify-center rounded-xl border border-[#d8e3dc] p-2 text-slate-700"
            >
              <Icon
                name={isMobileMenuOpen ? "x" : "menu"}
                className="h-5 w-5"
              />
            </button>
            {isMobileMenuOpen ? (
              <button
                type="button"
                aria-label="Close mobile menu overlay"
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-10 cursor-default bg-transparent"
              />
            ) : null}
            {isMobileMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+12px)] z-20 w-[260px] rounded-[24px] border border-[#e7eee9] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,32,0.08)]">
                <nav className="flex flex-col gap-1">
                  {publicNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#edf6ef] hover:text-[#0f7b36]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-4 grid gap-3 border-t border-[#edf1ee] pt-4">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-xl border border-[#d8e3dc] px-4 py-3 text-center text-sm font-semibold text-slate-700"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-xl bg-[#0f7b36] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-[104px] md:px-8 md:pb-10 md:pt-[112px]">
        {children}
      </main>
      <footer className="border-t border-[#e7eee9] bg-[#0f1720] text-white">
        <div className="md:hidden bg-[#0f1720] px-6 py-12 text-slate-300">
          <div className="flex items-start gap-4">
            <Icon name="logo" className="h-6 w-auto" />
          </div>

          <p className="mt-8 max-w-[360px] text-sm leading-7 text-slate-400">
            Built for fast manual transaction processing, referral bonus
            tracking, cross-service requests, and clear administrative
            oversight.
          </p>

          <div className="mt-11 grid grid-cols-2 gap-x-10 gap-y-10">
            {mobileFooterGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm mt-3 font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  {group.title}
                </h2>
                <div className="mt-2 grid gap-3.5">
                  {group.links.map((item) => (
                    <Link
                      key={`${group.title}-${item.label}`}
                      href={item.href}
                      className="text-sm font-medium leading-6 text-slate-300/85 transition hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 border-y border-white/10 py-8">
            <div className="flex items-center gap-3 text-sm text-slate-300/85">
              <Icon name="mail" className="h-4 w-4 shrink-0 text-emerald-200" />
              <Link
                href="mailto:hello@Ofenetwork.ng"
                className="transition hover:text-white"
              >
                hello@Ofenetwork.ng
              </Link>
            </div>
            <div className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-300/85">
              <Icon
                name="pin"
                className="mt-1 h-4 w-4 shrink-0 text-emerald-200"
              />
              <span>
                Secure transactions. Transparent rates. Reliable support.
              </span>
            </div>
          </div>

          <div className="pt-8 text-center">
            <p className="text-xs text-slate-400">
              &copy; 2026 Ofenetworks Solutions. All rights reserved.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs text-slate-400">
              <Link href="/terms" className="transition hover:text-white">
                Terms
              </Link>
              <Link href="/privacy-policy" className="transition hover:text-white">
                Privacy
              </Link>
              <Link href="/cookies" className="transition hover:text-white">
                Cookies
              </Link>
              <Link href="/services" className="transition hover:text-white">
                Sitemap
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto hidden max-w-7xl gap-10 px-4 py-12 md:grid md:grid-cols-[1.15fr_0.85fr_0.85fr] md:px-8">
          <div>
            <div className="flex items-center gap-3">
              <Icon name="logo" className="h-6 w-auto" />
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              Built for fast manual transaction processing, referral bonus
              tracking, cross-service requests, and clear administrative
              oversight.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Explore
            </h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              {publicNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/support" className="transition hover:text-white">
                Contact Support
              </Link>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Services
            </h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <span>Deriv Funding</span>
              <span>Crypto Transactions</span>
              <span>Skrill and PayPal</span>
              <span>Zelle and Payoneer</span>
              <span>Buy4Me Orders</span>
            </div>
          </div>
        </div>
        <div className="hidden border-t border-white/10 md:block">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slate-400 md:flex-row md:items-center md:justify-between md:px-8">
            <p>&copy; 2026 Ofenetworks Solutions. All rights reserved.</p>
            <p>Secure transactions. Transparent rates. Reliable support.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
