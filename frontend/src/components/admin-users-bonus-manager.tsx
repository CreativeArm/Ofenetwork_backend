"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addUserBonus,
  calculateBonusBalance,
  fetchAdminUsers,
  removeUserBonus,
  type BackendAdminUser,
} from "../lib/admin-backend";
import { notifyBonusBalanceUpdated } from "../lib/bonus-events";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { useGlobalSearch } from "../lib/search-context";
import { AdminStatusBadge } from "./admin-ui";
import { Icon } from "./icons";

type BonusType = "REFERRAL_BONUS" | "THRESHOLD_BONUS";

interface AdminUsersBonusManagerProps {
  users?: readonly BackendAdminUser[];
}

function formatCurrency(amount: number, currency: "NGN" | "USD" = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatBonusType(type: string) {
  if (type === "REFERRAL_BONUS") {
    return "Referral bonus";
  }
  if (type === "THRESHOLD_BONUS") {
    return "Threshold bonus";
  }
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getActorId() {
  if (typeof window === "undefined") {
    return "admin-local";
  }

  try {
    const rawUser = window.localStorage.getItem("ofe_user");
    const parsed = rawUser ? (JSON.parse(rawUser) as { id?: string }) : null;
    return parsed?.id ?? "admin-local";
  } catch {
    return "admin-local";
  }
}

export function AdminUsersBonusManager({ users = [] }: AdminUsersBonusManagerProps) {
  const { searchQuery } = useGlobalSearch();
  const [items, setItems] = useState<BackendAdminUser[]>([...users]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [bonusType, setBonusType] = useState<BonusType>("REFERRAL_BONUS");
  const [amount, setAmount] = useState("2000");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadUsers = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setErrorMessage(null);
    try {
      const fetched = await fetchAdminUsers();
      if (Array.isArray(fetched)) {
        setItems(fetched);
      }
    } catch (err) {
      if (!silent) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Failed to load registered users from backend.",
        );
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    const interval = window.setInterval(() => loadUsers(true), 25000);
    const onFocus = () => loadUsers(true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;

    return items.filter(
      (user) =>
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query) ||
        user.kycStatus?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const activeUser = useMemo(
    () => items.find((user) => user.id === activeUserId) ?? null,
    [activeUserId, items],
  );

  useBodyScrollLock(Boolean(activeUser));

  const openBonusModal = (user: BackendAdminUser) => {
    setActiveUserId(user.id);
    setBonusType("REFERRAL_BONUS");
    setAmount("2000");
    setFeedback(null);
  };

  const closeBonusModal = () => {
    setActiveUserId(null);
    setBonusType("REFERRAL_BONUS");
    setAmount("2000");
    setFeedback(null);
  };

  const updateWallet = (
    userId: string,
    wallet: NonNullable<BackendAdminUser["wallet"]>,
  ) => {
    setItems((current) =>
      current.map((user) => (user.id === userId ? { ...user, wallet } : user)),
    );
  };

  const activeCredits = (user: BackendAdminUser) =>
    user.wallet?.credits.filter(
      (credit) =>
        ["REFERRAL_BONUS", "THRESHOLD_BONUS", "PROMOTIONAL_BONUS", "ADMIN_CREDIT"].includes(credit.type) &&
        credit.amount > credit.consumedAmount,
    ) ?? [];

  const addBonus = async () => {
    if (!activeUser) {
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback("Enter a valid bonus amount.");
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);
      const wallet = await addUserBonus({
        actorId: getActorId(),
        userId: activeUser.id,
        amount: parsedAmount,
        currency: "NGN",
        type: bonusType,
      });
      updateWallet(activeUser.id, wallet);
      notifyBonusBalanceUpdated(activeUser.id);
      setFeedback("Bonus added successfully.");
      setTimeout(() => {
        closeBonusModal();
      }, 1000);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to add bonus.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeBonus = async (userId: string, creditId: string) => {
    try {
      setIsSaving(true);
      setFeedback(null);
      const wallet = await removeUserBonus({
        actorId: getActorId(),
        userId,
        creditId,
      });
      updateWallet(userId, wallet);
      notifyBonusBalanceUpdated(userId);
      setFeedback("Bonus removed successfully.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to remove bonus.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold">Customer Directory ({items.length})</h3>
            <button
              type="button"
              onClick={() => loadUsers()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe5df] bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-[#f4f7f5] disabled:opacity-60"
            >
              <Icon name="arrow" className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            View customer details, review KYC status, and manage bonuses per user.
          </p>
        </div>
        <div className="rounded-xl border border-[#dbe5df] bg-white px-4 py-2.5 text-xs font-medium text-slate-600 shadow-sm">
          Threshold rule: N500,000 transaction = N2,000 bonus
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading && items.length === 0 ? (
        <div className="rounded-[22px] border border-[#edf1ee] bg-[#fbfdfb] p-8 text-center text-sm text-slate-500">
          <Icon name="users" className="mx-auto h-8 w-8 animate-pulse text-[#0f7b36]" />
          <p className="mt-3 font-semibold text-slate-700">Loading user accounts from backend...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#dbe5df] bg-[#f8fbf8] p-8 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-700">No matching users found.</p>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const totalVolume =
              user.transactions?.reduce(
                (sum, transaction) => sum + (transaction.nairaEquivalent || 0),
                0,
              ) ?? 0;
            const bonusBalance = calculateBonusBalance(user.wallet);
            const credits = activeCredits(user);

            const kycBadge =
              user.kycStatus === "APPROVED"
                ? { label: "Verified", tone: "success" as const }
                : user.kycStatus === "PENDING"
                  ? { label: "KYC Pending", tone: "warning" as const }
                  : user.kycStatus === "REJECTED"
                    ? { label: "KYC Rejected", tone: "danger" as const }
                    : { label: "Unverified", tone: "neutral" as const };

            return (
              <div
                key={user.id}
                className="rounded-[22px] border border-[#edf1ee] bg-white p-4 transition-all hover:border-[#cfe2d5] hover:shadow-[0_4px_20px_rgba(15,23,32,0.04)]"
              >
                <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.42fr_0.58fr] md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{user.fullName || "Unnamed User"}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-400">ID: {user.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Transaction Volume
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatCurrency(totalVolume)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Bonus Balance
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#0f7b36]">
                      {formatCurrency(bonusBalance)}
                    </p>
                  </div>
                  <div className="justify-self-start">
                    <AdminStatusBadge
                      label={kycBadge.label}
                      tone={kycBadge.tone}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => openBonusModal(user)}
                    className="rounded-xl bg-[#0f7b36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#116f34] md:justify-self-end"
                  >
                    Add Bonus
                  </button>
                </div>

                {credits.length > 0 ? (
                  <div className="mt-3 border-t border-[#f2f5f3] pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Active Bonuses ({credits.length})
                    </p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {credits.map((credit) => {
                        const available = credit.amount - credit.consumedAmount;
                        return (
                          <div
                            key={credit.id}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-[#f8fbf8] px-3 py-2 border border-[#eef3ef]"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {formatBonusType(credit.type)}
                              </p>
                              <p className="text-xs text-slate-500">
                                Available: {formatCurrency(available, credit.currency)}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => removeBonus(user.id, credit.id)}
                              className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {activeUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-[2px]"
          onClick={closeBonusModal}
        >
          <div
            className="w-full max-w-[460px] rounded-[28px] border border-[#e5ebe7] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,32,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Assign User Bonus
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">
                  {activeUser.fullName}
                </h4>
                <p className="mt-1 text-sm text-slate-500">{activeUser.email}</p>
              </div>
              <button
                type="button"
                onClick={closeBonusModal}
                className="rounded-full border border-[#dbe5df] px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
              >
                Close
              </button>
            </div>

            {feedback ? (
              <p className="mt-4 rounded-2xl bg-[#f6faf7] px-4 py-3 text-sm font-semibold text-slate-700">
                {feedback}
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Bonus type
                </span>
                <select
                  value={bonusType}
                  onChange={(event) => setBonusType(event.target.value as BonusType)}
                  className="w-full rounded-2xl border border-[#e5ebe7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                >
                  <option value="REFERRAL_BONUS">Referral bonus</option>
                  <option value="THRESHOLD_BONUS">Threshold bonus</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Amount (NGN)
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="2000"
                />
              </label>

              {bonusType === "THRESHOLD_BONUS" ? (
                <div className="rounded-2xl bg-[#f8fbf8] p-3 text-xs text-slate-600">
                  Threshold rule: add N2,000 after the user reaches N500,000 qualifying transaction volume.
                </div>
              ) : (
                <div className="rounded-2xl bg-[#f8fbf8] p-3 text-xs text-slate-600">
                  Referral rule: added manually after the referred person completes a $30+ transaction.
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeBonusModal}
                className="rounded-2xl border border-[#dbe5df] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fbf8]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={addBonus}
                className="rounded-2xl bg-[#0f7b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#116f34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Adding..." : "Add Bonus"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
