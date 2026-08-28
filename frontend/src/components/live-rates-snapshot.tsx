"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ServiceIcon, getRateServiceIconName } from "./service-icon";
import { Stagger, StaggerItem } from "./homepage-motion";
import { mapBackendRatesToBoard } from "../lib/admin-backend";
import { getDefaultPublicRates, loadPublicRates } from "../lib/public-rates";

interface RateItem {
  id: string;
  name: string;
  deposit: string;
  withdrawal: string;
}

export function LiveRatesSnapshot() {
  const [rates, setRates] = useState<RateItem[]>(() => mapBackendRatesToBoard(getDefaultPublicRates()));
  useEffect(() => {
    loadPublicRates().then(({ rates: fetched }) => setRates(mapBackendRatesToBoard(fetched)));
  }, []);

  return (
    <div className="min-w-0 rounded-[26px] border border-[#e6ece8] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)] sm:rounded-[30px] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Live Rates Snapshot</h3>
          <p className="mt-1 text-sm text-slate-500">A quick view of current deposit and withdrawal rates.</p>
        </div>
        <Link href="/services/crypto" className="text-sm font-semibold text-[#0f7b36]">
          View services
        </Link>
      </div>

      <Stagger className="mt-6 space-y-3">
        {rates.map((rate) => {
          const iconName = getRateServiceIconName(rate.name);
          return (
            <StaggerItem key={rate.id}>
              <div className="flex flex-col gap-3 rounded-[20px] border border-[#edf1ee] px-4 py-4 transition-colors duration-300 hover:border-[#dbe6df] hover:bg-[#fbfdfb] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  {iconName ? (
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6faf7]">
                      <ServiceIcon name={iconName} className="h-5 w-5 object-contain" />
                    </span>
                  ) : null}
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-900">{rate.name}</p>
                    <p className="text-xs text-slate-500">Updated in today&apos;s rate board</p>
                  </div>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-sm font-semibold text-[#0f7b36]">{rate.deposit}</p>
                  <p className="text-xs text-slate-500">{rate.withdrawal}</p>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
