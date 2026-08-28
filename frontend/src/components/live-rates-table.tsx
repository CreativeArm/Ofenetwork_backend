"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type BackendRate } from "../lib/admin-backend";
import { getDefaultPublicRates, loadPublicRates } from "../lib/public-rates";
import { getRateServiceIconName, ServiceIcon, type ServiceIconName } from "./service-icon";

type ServiceMetadata = {
  href: string;
  iconName: ServiceIconName | null;
};

function getServiceMetadata(service: string): ServiceMetadata {
  const normalizedService = service.toLowerCase();

  if (normalizedService.includes("deriv")) return { href: "/services/deriv", iconName: "deriv" };
  if (normalizedService.includes("crypto") || normalizedService.includes("usdt")) return { href: "/services/crypto", iconName: "crypto" };
  if (normalizedService.includes("skrill")) return { href: "/services/skrill", iconName: "skrill" };
  if (normalizedService.includes("paypal")) return { href: "/services/paypal", iconName: "paypal" };
  if (normalizedService.includes("zelle") || normalizedService.includes("venmo")) return { href: "/services/venmo", iconName: "venmo" };
  if (normalizedService.includes("payoneer")) return { href: "/services/payoneer", iconName: "payoneer" };
  if (normalizedService.includes("buy 4 me") || normalizedService.includes("buy4me")) return { href: "/buy4me", iconName: "buy4me" };

  return { href: "/services", iconName: getRateServiceIconName(service) };
}

function formatUpdatedAt(rates: BackendRate[]) {
  const latestUpdate = rates.reduce<Date | null>((latest, rate) => {
    const date = new Date(rate.updatedAt);
    if (Number.isNaN(date.getTime())) return latest;
    return !latest || date > latest ? date : latest;
  }, null);

  if (!latestUpdate) return "Live rates";

  return `Updated ${latestUpdate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  })}`;
}

function ServiceMark({ service }: { service: string }) {
  const { iconName } = getServiceMetadata(service);

  if (iconName) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e3eee6] bg-white shadow-sm">
        <ServiceIcon name={iconName} className="h-5 w-5 object-contain" />
      </span>
    );
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf7ee] text-sm font-bold text-[#0f7b36]">
      {service.slice(0, 2).toUpperCase()}
    </span>
  );
}

function TradeLink({ service }: { service: string }) {
  const { href } = getServiceMetadata(service);

  return (
    <Link
      href={`/login?next=${encodeURIComponent(href)}`}
      className="inline-flex items-center justify-center rounded-full bg-[#0f7b36] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0c6730] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0f7b36] focus:ring-offset-2 active:scale-95"
    >
      Trade
    </Link>
  );
}

export function LiveRatesTable() {
  const [rates, setRates] = useState<BackendRate[]>(getDefaultPublicRates);
  const [usingFallback, setUsingFallback] = useState(true);

  useEffect(() => {
    let active = true;

    const loadRates = async () => {
      const response = await loadPublicRates();
      if (active) {
        setRates(response.rates);
        setUsingFallback(response.isFallback);
      }
    };

    void loadRates();
    const interval = window.setInterval(() => void loadRates(), 60_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const updatedAt = useMemo(() => formatUpdatedAt(rates), [rates]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#dceade] bg-white shadow-[0_20px_60px_rgba(15,23,32,0.06)]">
      <div className="flex flex-col gap-4 border-b border-[#edf3ee] bg-[#f8fcf9] px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-7">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900">Current service rates</h3>
          <p className="mt-1 text-sm text-slate-500">Compare every available service before you trade.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cae6d1] bg-white px-3 py-1.5 text-xs font-semibold text-[#0f7b36]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#0f7b36]" />
          {usingFallback ? "Rate" : "Live Rate"}
        </span>
      </div>

      <div className="hidden md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#edf3ee] text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <th className="px-7 py-4 font-semibold">Service</th>
              <th className="px-5 py-4 text-right font-semibold">Deposit rate</th>
              <th className="px-5 py-4 text-right font-semibold">Withdrawal rate</th>
              <th className="px-7 py-4 text-right font-semibold">Trade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f5f1]">
            {rates.map((rate) => (
              <tr key={rate.id} className="transition-colors hover:bg-[#f8fcf9]">
                <td className="px-7 py-4">
                  <div className="flex items-center gap-3">
                    <ServiceMark service={rate.service} />
                    <p className="font-semibold text-slate-900">{rate.service}</p>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <p className="font-semibold text-[#0f7b36]">{rate.depositRate}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">You receive</p>
                </td>
                <td className="px-5 py-4 text-right">
                  <p className="font-semibold text-slate-900">{rate.withdrawalRate}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">You send</p>
                </td>
                <td className="px-7 py-4 text-right"><TradeLink service={rate.service} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {rates.map((rate) => (
          <article key={rate.id} className="rounded-2xl border border-[#e7f0e9] bg-[#fbfefc] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <ServiceMark service={rate.service} />
                <p className="truncate font-semibold text-slate-900">{rate.service}</p>
              </div>
              <TradeLink service={rate.service} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e7f0e9] pt-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">Deposit</p>
                <p className="mt-1 text-sm font-semibold text-[#0f7b36]">{rate.depositRate}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">Withdrawal</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{rate.withdrawalRate}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
