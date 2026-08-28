import Link from "next/link";
import { ServiceIcon, getRateServiceIconName } from "./service-icon";

interface RateItem {
  name: string;
  deposit: string;
  withdrawal: string;
}

interface RatesBoardProps {
  rates: RateItem[];
  admin?: boolean;
  actionHref?: string;
  actionLabel?: string;
  marquee?: boolean;
}

export function RatesBoard({
  rates,
  admin = false,
  actionHref,
  actionLabel = "Edit",
  marquee = false,
}: RatesBoardProps) {
  if (marquee) {
    const marqueeRates = [...rates, ...rates];

    return (
      <div className="overflow-hidden">
        <div className="rates-marquee-track flex w-max gap-2.5 md:gap-3">
          {marqueeRates.map((rate, index) => {
            const iconName = getRateServiceIconName(rate.name);

            return (
              <article
                key={`${rate.name}-${index}`}
                className="flex min-h-[240px] min-w-[220px] max-w-[220px] flex-col justify-between rounded-[26px] border border-[#e4ebe7] bg-white px-5 py-5 shadow-[0_12px_32px_rgba(15,23,32,0.04)] md:min-h-[260px] md:min-w-[250px] md:max-w-[250px]"
                aria-hidden={index >= rates.length}
              >
                <div className="flex items-center gap-3">
                  {iconName ? (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6faf7]">
                      <ServiceIcon name={iconName} className="h-5 w-5 object-contain" />
                    </span>
                  ) : null}
                  <div>
                    <p className="text-sm font-semibold text-slate-800 md:text-base">{rate.name}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 md:text-[11px]">Live rate</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[18px] bg-[#f5f8f6] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 md:text-[11px]">Deposit</p>
                    <p className="mt-2 text-sm font-semibold text-[#0f7b36] md:text-[15px]">{rate.deposit}</p>
                  </div>
                  <div className="rounded-[18px] bg-[#f5f8f6] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 md:text-[11px]">Withdrawal</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800 md:text-[15px]">{rate.withdrawal}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#edf1ee]">
      <div className={`hidden ${admin ? "md:grid-cols-4" : "md:grid-cols-3"} bg-[#f8fbf8] px-5 py-4 text-sm font-semibold text-slate-500 md:grid`}>
        <p>Service</p>
        <p>{admin ? "Deposit Rate" : "Deposit Rate (You Receive)"}</p>
        <p>{admin ? "Withdrawal Rate" : "Withdrawal Rate (You Send)"}</p>
        {admin ? <p>Action</p> : null}
      </div>

      <div className="md:hidden">
        {rates.map((rate, index) => {
          const iconName = getRateServiceIconName(rate.name);
          return (
            <div key={rate.name} className={`space-y-4 px-4 py-4 ${index > 0 ? "border-t border-[#edf1ee]" : ""}`}>
              <div className="flex items-center gap-3">
                {iconName ? (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6faf7]">
                    <ServiceIcon name={iconName} className="h-5 w-5 object-contain" />
                  </span>
                ) : null}
                <p className="text-base font-semibold text-slate-800">{rate.name}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-[#f8fbf8] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Deposit</p>
                  <p className="mt-2 text-sm font-semibold text-[#0f7b36]">{rate.deposit}</p>
                </div>
                <div className="rounded-[18px] bg-[#f8fbf8] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Withdrawal</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{rate.withdrawal}</p>
                </div>
              </div>

              {admin && actionHref ? (
                <Link
                  href={actionHref}
                  className="inline-flex rounded-xl border border-[#dbe5df] px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {actionLabel}
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="hidden md:block">
        {rates.map((rate) => {
          const iconName = getRateServiceIconName(rate.name);
          return (
            <div
              key={rate.name}
              className={`grid items-center border-t border-[#edf1ee] px-5 py-4 text-sm ${admin ? "grid-cols-4" : "grid-cols-3"}`}
            >
              <div className="flex items-center gap-3">
                {iconName ? (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f6faf7]">
                    <ServiceIcon name={iconName} className="h-5 w-5 object-contain" />
                  </span>
                ) : null}
                <p className="font-semibold text-slate-800">{rate.name}</p>
              </div>
              <p className="font-semibold text-[#0f7b36]">{rate.deposit}</p>
              <p className="font-semibold text-slate-800">{rate.withdrawal}</p>
              {admin ? (
                actionHref ? (
                  <Link
                    href={actionHref}
                    className="w-fit rounded-lg border border-[#dbe5df] px-3 py-1.5 text-center text-xs font-semibold text-slate-600"
                  >
                    {actionLabel}
                  </Link>
                ) : (
                  <span />
                )
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
