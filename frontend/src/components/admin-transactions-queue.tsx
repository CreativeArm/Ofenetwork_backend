"use client";

import { useEffect, useMemo, useState } from "react";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { useGlobalSearch } from "../lib/search-context";
import {
  buildProofPlaceholder,
  fetchAdminTransactions,
  fetchAdminUsers,
  formatCurrency,
  formatRelativeTime,
  type BackendAdminUser,
  type BackendTransaction,
} from "../lib/admin-backend";
import { getPrimaryTransactionDetail } from "../lib/transaction-details";
import { AdminStatusBadge } from "./admin-ui";
import { Icon } from "./icons";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:4000/api";

export type TransactionStatus = "Pending" | "Confirmed" | "Rejected";

export interface AdminTransactionRecord {
  id: string;
  userId?: string;
  user: string;
  userEmail?: string;
  reference?: string;
  service: string;
  type: string;
  amount: string;
  status: TransactionStatus;
  time: string;
  paymentReference: string;
  paymentReferenceLabel?: string;
  proofName: string;
  proofHref: string;
  bonusWithdrawalRequested?: boolean;
  destinationDetails?: Record<string, string>;
  adminActionHistory?: Array<{
    action: string;
    actorId: string;
    note?: string;
    at: string;
  }>;
}

interface AdminTransactionsQueueProps {
  items?: readonly AdminTransactionRecord[];
}

function toneForStatus(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("confirm")) {
    return "success" as const;
  }
  if (lower.includes("pending")) {
    return "warning" as const;
  }
  if (lower.includes("reject")) {
    return "danger" as const;
  }
  return "neutral" as const;
}

const filters = ["All", "Pending", "Confirmed", "Rejected"] as const;
const hiddenDetailKeys = new Set(["bonusCreditBreakdown"]);

function formatDetailLabel(label: string) {
  return label
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSubmittedDetails(transaction: AdminTransactionRecord) {
  const details =
    transaction.destinationDetails &&
    Object.entries(transaction.destinationDetails)
      .filter(([key, value]) => value && !hiddenDetailKeys.has(key))
      .map(([key, value]) => ({
        label: formatDetailLabel(key),
        value,
      }));

  if (details && details.length > 0) {
    if (
      transaction.reference &&
      !details.some((d) => d.value.toLowerCase() === transaction.reference?.toLowerCase())
    ) {
      details.push({
        label: "Reference",
        value: transaction.reference,
      });
    }
    return details;
  }

  return [
    {
      label: transaction.paymentReferenceLabel ?? "Submitted Detail",
      value: transaction.paymentReference || "No submitted details",
    },
  ];
}

function mapToAdminTransactionRecord(
  item: BackendTransaction,
  users: BackendAdminUser[] = [],
): AdminTransactionRecord {
  const user = users.find((entry) => entry.id === item.userId);
  const amount = formatCurrency(item.nairaEquivalent);
  const proofHref =
    item.proofOfPaymentUrl ??
    buildProofPlaceholder(item.id, item.service, amount);
  const primaryDetail = getPrimaryTransactionDetail(item);

  return {
    id: item.id,
    userId: item.userId,
    user: item.userFullName ?? user?.fullName ?? "Unknown user",
    userEmail: item.userEmail ?? user?.email,
    reference: item.reference ?? undefined,
    service: item.service,
    type:
      item.type === "DEPOSIT"
        ? "Deposit"
        : item.type === "WITHDRAWAL"
          ? "Withdrawal"
          : item.type,
    amount,
    status: (
      item.status === "CONFIRMED"
        ? "Confirmed"
        : item.status === "REJECTED"
          ? "Rejected"
          : "Pending"
    ) as TransactionStatus,
    time: formatRelativeTime(item.createdAt),
    paymentReference: primaryDetail?.value ?? "No submitted detail",
    paymentReferenceLabel: primaryDetail?.label ?? "Submitted Detail",
    proofName: `${item.id}-proof.svg`,
    proofHref,
    bonusWithdrawalRequested:
      item.destinationDetails?.bonusWithdrawalRequested === "Yes" ||
      item.destinationDetails?.bonusCashout === "Yes",
    destinationDetails: item.destinationDetails,
    adminActionHistory: item.adminActionHistory,
  };
}

export function AdminTransactionsQueue({ items = [] }: AdminTransactionsQueueProps) {
  const { searchQuery } = useGlobalSearch();
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]>("Pending");
  const [transactions, setTransactions] = useState<AdminTransactionRecord[]>([...items]);
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTransactions = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setErrorMessage(null);
    try {
      const txs = await fetchAdminTransactions();
      let users: BackendAdminUser[] = [];
      try {
        users = await fetchAdminUsers();
      } catch {
        // Fallback to embedded userFullName/userEmail if user list fetch is slow
      }
      if (Array.isArray(txs)) {
        setTransactions(txs.map((tx) => mapToAdminTransactionRecord(tx, users)));
      }
    } catch (err) {
      if (!silent) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Failed to load transactions from backend.",
        );
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    const interval = window.setInterval(() => loadTransactions(true), 25000);
    const onFocus = () => loadTransactions(true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const activeTransaction =
    transactions.find((item) => item.id === activeTransactionId) ?? null;
  const activeSubmittedDetails = activeTransaction
    ? getSubmittedDetails(activeTransaction)
    : [];

  useBodyScrollLock(Boolean(activeTransaction));

  const filterCounts = useMemo(() => {
    const counts = {
      All: transactions.length,
      Pending: 0,
      Confirmed: 0,
      Rejected: 0,
    };
    transactions.forEach((tx) => {
      if (tx.status === "Pending") counts.Pending++;
      else if (tx.status === "Confirmed") counts.Confirmed++;
      else if (tx.status === "Rejected") counts.Rejected++;
    });
    return counts;
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return transactions.filter((item) => {
      const matchesFilter = selectedFilter === "All" || item.status === selectedFilter;
      if (!matchesFilter) return false;

      if (!query) return true;

      const destValues = item.destinationDetails
        ? Object.values(item.destinationDetails).join(" ").toLowerCase()
        : "";

      return (
        item.id.toLowerCase().includes(query) ||
        (item.reference && item.reference.toLowerCase().includes(query)) ||
        item.user.toLowerCase().includes(query) ||
        (item.userEmail && item.userEmail.toLowerCase().includes(query)) ||
        item.service.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.amount.toLowerCase().includes(query) ||
        item.paymentReference?.toLowerCase().includes(query) ||
        destValues.includes(query)
      );
    });
  }, [selectedFilter, transactions, searchQuery]);

  const updateStatus = async (id: string, status: TransactionStatus) => {
    const previousStatus =
      transactions.find((item) => item.id === id)?.status ?? "Pending";

    setTransactions((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );

    if (status === "Pending") {
      return;
    }

    setIsUpdating(true);

    try {
      const storedUser = window.localStorage.getItem("ofe_user");
      const actorId = storedUser ? (JSON.parse(storedUser) as { id?: string }).id : undefined;

      const response = await fetch(`${API_BASE_URL}/transactions/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status === "Confirmed" ? "CONFIRMED" : "REJECTED",
          actorId: actorId ?? "admin-local",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update transaction");
      }

      await loadTransactions(true);
    } catch {
      setTransactions((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: previousStatus } : item,
        ),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold">Manual Review Queue ({transactions.length})</h3>
            <button
              type="button"
              onClick={() => loadTransactions()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe5df] bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-[#f4f7f5] disabled:opacity-60"
            >
              <Icon name="arrow" className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Approve, reject, and track every deposits, withdrawals, and bonus payouts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => {
            const count = filterCounts[item];
            return (
              <button
                key={item}
                type="button"
                onClick={() => setSelectedFilter(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedFilter === item
                    ? "bg-[#0f7b36] text-white"
                    : "bg-[#f4f7f5] text-slate-600 hover:bg-[#eaf4ed]"
                }`}
              >
                {item} {count > 0 ? `(${count})` : "(0)"}
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading && transactions.length === 0 ? (
        <div className="rounded-[22px] border border-[#edf1ee] bg-[#fbfdfb] p-8 text-center text-sm text-slate-500">
          <Icon name="bank" className="mx-auto h-8 w-8 animate-pulse text-[#0f7b36]" />
          <p className="mt-3 font-semibold text-slate-700">Loading transactions from backend...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#dbe5df] bg-[#f8fbf8] p-8 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-700">No {selectedFilter !== "All" ? selectedFilter.toLowerCase() : ""} transactions found.</p>
          <p className="mt-1 text-xs text-slate-400">When users submit deposits or withdrawals, they will appear here in real time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 rounded-[22px] border border-[#edf1ee] bg-white p-4 transition-all hover:border-[#cfe2d5] hover:shadow-[0_4px_20px_rgba(15,23,32,0.04)] md:grid-cols-[1fr_0.85fr_0.6fr_0.55fr] md:items-center"
            >
              <div>
                <p className="font-semibold text-slate-900">{item.user}</p>
                <p className="text-sm text-slate-500">{item.service}</p>
                <p className="mt-1 text-xs text-slate-400">{item.id}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.type}</p>
                <p className="text-sm text-slate-500">{item.amount}</p>
              </div>
              <div>
                <AdminStatusBadge label={item.status} tone={toneForStatus(item.status)} />
                <p className="mt-2 text-xs text-slate-400">{item.time}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTransactionId(item.id)}
                className="rounded-xl border border-[#dbe5df] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbf8]"
              >
                Open Review
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTransaction ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-[2px]"
          onClick={() => setActiveTransactionId(null)}
        >
          <div
            className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-[28px] border border-[#e5ebe7] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,32,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Transaction Review
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">
                  {activeTransaction.user}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  {activeTransaction.service} {"|"} {activeTransaction.amount}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTransactionId(null)}
                className="rounded-full border border-[#dbe5df] px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
              >
                Close
              </button>
            </div>

            <div className="mt-5">
              <div className="rounded-[18px] bg-[#f8fbf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Status
                </p>
                <div className="mt-2">
                  <AdminStatusBadge
                    label={activeTransaction.status}
                    tone={toneForStatus(activeTransaction.status)}
                  />
                </div>
              </div>
            </div>

            {activeTransaction.bonusWithdrawalRequested ? (
              <div className="mt-4 rounded-[18px] border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-800">
                  Bonus withdrawal requested
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  Review this user&apos;s available referral or threshold bonus before confirming the withdrawal.
                </p>
              </div>
            ) : null}

            <div className="mt-4 rounded-[18px] bg-[#f8fbf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Submitted Information
              </p>
              <div className="mt-3 overflow-hidden rounded-[16px] border border-[#e5ebe7] bg-white">
                {activeSubmittedDetails.map((detail) => (
                  <div
                    key={`${detail.label}-${detail.value}`}
                    className="grid gap-1 border-b border-[#edf1ee] px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[0.65fr_1fr] sm:gap-4"
                  >
                    <span className="font-medium text-slate-500">{detail.label}</span>
                    <span className="break-all font-semibold text-slate-900">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-[#e5ebe7] bg-[#fbfdfb] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Attached receipt / proof
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Proof of payment submitted by user
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={activeTransaction.proofHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-[#cfe2d5] bg-white px-3 py-2 text-xs font-semibold text-[#0f7b36] transition hover:bg-[#eef8f1]"
                  >
                    View
                  </a>
                  <a
                    href={activeTransaction.proofHref}
                    download={activeTransaction.proofName}
                    className="rounded-xl border border-[#cfe2d5] bg-white px-3 py-2 text-xs font-semibold text-[#0f7b36] transition hover:bg-[#eef8f1]"
                  >
                    Download
                  </a>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[18px] border border-[#e5ebe7] bg-white">
                <img
                  src={activeTransaction.proofHref}
                  alt={`${activeTransaction.id} uploaded proof`}
                  className="max-h-60 w-full object-contain p-2"
                />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Action
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => void updateStatus(activeTransaction.id, "Rejected")}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    activeTransaction.status === "Rejected"
                      ? "bg-rose-600 text-white"
                      : "border border-[#f0d7d7] bg-white text-rose-600 hover:bg-rose-50"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => void updateStatus(activeTransaction.id, "Confirmed")}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    activeTransaction.status === "Confirmed"
                      ? "bg-emerald-600 text-white"
                      : "bg-[#0f7b36] text-white hover:bg-[#116f34]"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  Confirm
                </button>
              </div>
            </div>

            {activeTransaction.adminActionHistory &&
            activeTransaction.adminActionHistory.length > 0 ? (
              <div className="mt-5 rounded-[18px] border border-[#edf1ee] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Review History
                </p>
                <div className="mt-3 space-y-3">
                  {activeTransaction.adminActionHistory.map((entry, index) => (
                    <div key={`${entry.at}-${index}`} className="text-sm">
                      <p className="font-semibold text-slate-900">{entry.action}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {entry.at ? new Date(entry.at).toLocaleString("en-NG") : "Unknown time"}
                      </p>
                      {entry.note ? (
                        <p className="mt-1 text-xs text-slate-500">{entry.note}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
