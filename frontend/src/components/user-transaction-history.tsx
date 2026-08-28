"use client";

import { useEffect, useState } from "react";
import {
  fetchUserTransactions,
  formatCurrency,
  formatRelativeTime,
  getCachedApi,
  type BackendTransaction,
} from "../lib/admin-backend";
import { getPrimaryTransactionDetail } from "../lib/transaction-details";
import { Icon } from "./icons";

type StoredUser = {
  id?: string;
};

function getInitialUserTransactions(): BackendTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const rawUser = window.localStorage.getItem("ofe_user");
    const parsed = rawUser ? (JSON.parse(rawUser) as StoredUser) : null;
    if (!parsed?.id) return [];
    return getCachedApi<BackendTransaction[]>(`/transactions?userId=${encodeURIComponent(parsed.id)}`) ?? [];
  } catch {}
  return [];
}

function statusLabel(status: BackendTransaction["status"]) {
  if (status === "CONFIRMED") {
    return "Confirmed";
  }
  if (status === "REJECTED") {
    return "Rejected";
  }
  return "Pending";
}

function typeLabel(type: BackendTransaction["type"]) {
  if (type === "DEPOSIT") {
    return "Deposit";
  }
  if (type === "WITHDRAWAL") {
    return "Withdrawal";
  }
  if (type === "BUY4ME_PAYMENT") {
    return "Buy4Me Payment";
  }
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClass(status: BackendTransaction["status"]) {
  if (status === "CONFIRMED") {
    return "text-[#0f7b36]";
  }
  if (status === "REJECTED") {
    return "text-rose-600";
  }
  return "text-amber-600";
}

export function UserTransactionHistory() {
  const [transactions, setTransactions] = useState<BackendTransaction[]>(() => getInitialUserTransactions());
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    const initial = getInitialUserTransactions();
    return initial.length === 0;
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rawUser = window.localStorage.getItem("ofe_user");
      const parsed = rawUser ? (JSON.parse(rawUser) as StoredUser) : null;

      if (!parsed?.id) {
        setMessage("Sign in again to load your transaction history.");
        setIsLoading(false);
        return;
      }

      fetchUserTransactions(parsed.id)
        .then((items) => {
          setTransactions(items);
          setMessage(null);
        })
        .catch(() => {
          if (transactions.length === 0) {
            setMessage("Unable to load your transaction history right now.");
          }
        })
        .finally(() => setIsLoading(false));
    } catch {
      if (transactions.length === 0) {
        setMessage("Unable to load your transaction history right now.");
      }
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-w-0 rounded-[26px] border border-[#e6ece8] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)] sm:rounded-[30px] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Transaction History</h3>
          <p className="mt-1 text-sm text-slate-500">
            Track your submitted deposits, withdrawals, and admin decisions.
          </p>
        </div>
        <span className="rounded-full bg-[#f3fbf5] px-3 py-1 text-xs font-semibold text-[#0f7b36]">
          Live
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="rounded-[20px] border border-[#edf1ee] px-4 py-6 text-sm text-slate-500">
            Loading transaction history...
          </div>
        ) : null}

        {!isLoading && message ? (
          <div className="rounded-[20px] border border-[#edf1ee] px-4 py-6 text-sm text-slate-500">
            {message}
          </div>
        ) : null}

        {!isLoading && !message && transactions.length === 0 ? (
          <div className="rounded-[20px] border border-[#edf1ee] px-4 py-6 text-sm text-slate-500">
            No transactions yet.
          </div>
        ) : null}

        {transactions.slice(0, 8).map((item) => {
          const submittedDetail = getPrimaryTransactionDetail(item);

          return (
            <div
              key={item.id}
              className="min-w-0 rounded-[20px] border border-[#edf1ee] px-4 py-4 transition-colors duration-300 hover:border-[#dbe6df] hover:bg-[#fbfdfb]"
            >
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Icon
                      name={item.status === "CONFIRMED" ? "check" : "arrow"}
                      className="h-4 w-4"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-900">
                      {typeLabel(item.type)} - {item.service}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-400">{item.id}</p>
                  </div>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(item.nairaEquivalent, "NGN")}
                  </p>
                  <p className={`mt-1 text-xs font-semibold ${statusClass(item.status)}`}>
                    {statusLabel(item.status)}
                  </p>
                </div>
              </div>
              {submittedDetail ? (
                <div className="mt-4 rounded-[16px] bg-[#f8fbf8] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {submittedDetail.label}
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                    {submittedDetail.value}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
