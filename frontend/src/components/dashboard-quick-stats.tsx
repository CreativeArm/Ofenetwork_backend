"use client";

import { useEffect, useState } from "react";
import {
  fetchUserBuy4MeOrders,
  fetchUserTransactions,
  getCachedApi,
  type BackendBuy4MeOrder,
  type BackendTransaction,
} from "../lib/admin-backend";
import { Icon } from "./icons";
import { Stagger, StaggerItem } from "./homepage-motion";

type StoredUser = {
  id?: string;
};

type QuickStat = {
  label: string;
  value: string;
  note: string;
  icon: Parameters<typeof Icon>[0]["name"];
  accent: string;
  badge: string;
};

const openBuy4MeStatuses = new Set<BackendBuy4MeOrder["status"]>([
  "PROCESSING",
  "AWAITING_PAYMENT",
  "PAYMENT_SUBMITTED",
  "PURCHASING",
  "SHIPPED",
  "ISSUE",
]);

function getInitialPendingCount(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const rawUser = window.localStorage.getItem("ofe_user");
    const parsed = rawUser ? (JSON.parse(rawUser) as StoredUser) : null;
    if (!parsed?.id) return 0;

    const cachedTx = getCachedApi<BackendTransaction[]>(`/transactions?userId=${encodeURIComponent(parsed.id)}`);
    const cachedB4m = getCachedApi<BackendBuy4MeOrder[]>(`/buy4me?userId=${encodeURIComponent(parsed.id)}`);

    if (cachedTx || cachedB4m) {
      const txCount = (cachedTx ?? []).filter(
        (t) => t.status === "PENDING" && t.type !== "BUY4ME_PAYMENT",
      ).length;
      const b4mCount = (cachedB4m ?? []).filter((o) => openBuy4MeStatuses.has(o.status)).length;
      return txCount + b4mCount;
    }
  } catch {}
  return null;
}

export function DashboardQuickStats() {
  const [pendingRequests, setPendingRequests] = useState<number | null>(() => getInitialPendingCount());
  const [pendingNote, setPendingNote] = useState(
    "Live pending deposits, withdrawals, bonus cashouts, and Buy4Me orders.",
  );
  const [pendingBadge, setPendingBadge] = useState("Live requests");

  useEffect(() => {
    let isMounted = true;

    const loadPendingRequests = async () => {
      try {
        const rawUser = window.localStorage.getItem("ofe_user");
        const parsed = rawUser ? (JSON.parse(rawUser) as StoredUser) : null;

        if (!parsed?.id) {
          if (isMounted) {
            setPendingRequests(0);
            setPendingNote("Sign in to sync your live pending requests.");
            setPendingBadge("Login needed");
          }
          return;
        }

        const [transactions, buy4MeOrders] = await Promise.all([
          fetchUserTransactions(parsed.id),
          fetchUserBuy4MeOrders(parsed.id),
        ]);

        const pendingTransactionCount = transactions.filter(
          (transaction) =>
            transaction.status === "PENDING" &&
            transaction.type !== "BUY4ME_PAYMENT",
        ).length;
        const openBuy4MeCount = buy4MeOrders.filter((order) =>
          openBuy4MeStatuses.has(order.status),
        ).length;

        if (isMounted) {
          setPendingRequests(pendingTransactionCount + openBuy4MeCount);
          setPendingNote(
            "Live pending deposits, withdrawals, bonus cashouts, and Buy4Me orders.",
          );
          setPendingBadge("Live requests");
        }
      } catch {
        if (isMounted) {
          setPendingNote("Syncing latest live numbers...");
        }
      }
    };

    loadPendingRequests();
    const interval = window.setInterval(loadPendingRequests, 30000);
    window.addEventListener("focus", loadPendingRequests);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", loadPendingRequests);
    };
  }, []);

  const stats: QuickStat[] = [
    {
      label: "Active Services",
      value: "8",
      note: "Deriv, Crypto, Skrill, PayPal, Zelle, Payoneer, Buy4Me",
      icon: "grid",
      accent: "from-emerald-500/20 via-emerald-400/8 to-transparent",
      badge: "All modules live",
    },
    {
      label: "Pending Requests",
      value: pendingRequests === null ? "..." : pendingRequests.toLocaleString(),
      note: pendingNote,
      icon: "bell",
      accent: "from-amber-500/20 via-amber-400/8 to-transparent",
      badge: pendingBadge,
    },
    {
      label: "Referral Bonus",
      value: "Manual",
      note: "Added manually after the referred person completes a $30+ transaction.",
      icon: "wallet",
      accent: "from-sky-500/20 via-sky-400/8 to-transparent",
      badge: "Admin assigned",
    },
    {
      label: "Bonus Cashout",
      value: "No Min",
      note: "Withdraw any available bonus amount anytime with zero minimum restriction.",
      icon: "chart",
      accent: "from-violet-500/20 via-violet-400/8 to-transparent",
      badge: "No Minimum",
    },
  ];

  return (
    <Stagger className="grid grid-cols-2 gap-3 sm:gap-4">
      {stats.map((item) => (
        <StaggerItem
          key={item.label}
          className="group relative overflow-hidden rounded-[22px] border border-[#e6ece8] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)] p-3 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)] sm:rounded-[28px] sm:p-5"
        >
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`} />
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(15,123,54,0.08),transparent_68%)] sm:-right-12 sm:-top-12 sm:h-28 sm:w-28" />

          <div className="relative flex items-start justify-between gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3faf5] text-[#0f7b36] shadow-[inset_0_0_0_1px_rgba(15,123,54,0.08)] sm:h-11 sm:w-11">
              <Icon name={item.icon} className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <span className="hidden rounded-full border border-[#e3efe6] bg-[#f7fbf8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 sm:inline-flex sm:px-3 sm:text-[11px] sm:tracking-[0.12em]">
              {item.badge}
            </span>
          </div>

          <p className="mt-4 break-words text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 sm:mt-5 sm:text-[13px] sm:tracking-[0.18em]">
            {item.label}
          </p>
          <p className="mt-2.5 break-words text-[1.7rem] font-semibold leading-none text-slate-900 sm:mt-3 sm:text-[2.25rem]">
            {item.value}
          </p>
          <p className="mt-3 max-w-full break-words text-[12px] leading-6 text-slate-500 sm:mt-4 sm:max-w-[28ch] sm:text-sm">
            {item.note}
          </p>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
