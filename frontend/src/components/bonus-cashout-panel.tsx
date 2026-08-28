"use client";

import { useEffect, useState } from "react";
import {
  calculateBonusBalance,
  createBonusCashoutTransaction,
  fetchUserWallet,
  formatCurrency,
  getCachedApi,
  type BackendWallet,
} from "../lib/admin-backend";
import {
  BONUS_BALANCE_UPDATED_EVENT,
  notifyBonusBalanceUpdated,
} from "../lib/bonus-events";
import { KycVerificationGate } from "./kyc-verification-gate";

type StoredUser = {
  id?: string;
};

export function BonusCashoutPanel() {
  const [userId, setUserId] = useState<string | null>(null);
  const [availableBonus, setAvailableBonus] = useState<number>(0);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadWallet = (
    nextUserId: string,
    { showError = true }: { showError?: boolean } = {},
  ) => {
    // Show cached balance instantly
    const cached = getCachedApi<BackendWallet>(`/wallet/${encodeURIComponent(nextUserId)}`);
    if (cached) {
      const balance = calculateBonusBalance(cached);
      setAvailableBonus(balance);
      setAmount((current) => current || (balance > 0 ? String(balance) : ""));
    }

    fetchUserWallet(nextUserId)
      .then((wallet) => {
        const balance = calculateBonusBalance(wallet);
        setAvailableBonus(balance);
        setAmount((current) => current || (balance > 0 ? String(balance) : ""));
      })
      .catch(() => {
        if (showError && !cached) {
          setFeedback("Unable to load your bonus balance right now.");
        }
      });
  };

  useEffect(() => {
    let currentUserId: string | null = null;

    const loadCurrentUserWallet = ({
      showError = true,
    }: { showError?: boolean } = {}) => {
      try {
        const rawUser = window.localStorage.getItem("ofe_user");
        const parsed = rawUser ? (JSON.parse(rawUser) as StoredUser) : null;
        if (!parsed?.id) {
          if (showError) {
            setFeedback("Sign in again to cash your bonus.");
          }
          return;
        }

        currentUserId = parsed.id;
        setUserId(parsed.id);
        loadWallet(parsed.id, { showError });
      } catch {
        if (showError) {
          setFeedback("Unable to load your bonus details right now.");
        }
      }
    };

    const handleBonusUpdate = (event: Event) => {
      const updatedUserId = (event as CustomEvent<{ userId?: string }>).detail
        ?.userId;

      if (!updatedUserId || updatedUserId === currentUserId) {
        loadCurrentUserWallet({ showError: false });
      }
    };

    const handleFocus = () => loadCurrentUserWallet({ showError: false });

    loadCurrentUserWallet();
    const interval = window.setInterval(
      () => loadCurrentUserWallet({ showError: false }),
      10000,
    );
    window.addEventListener("focus", handleFocus);
    window.addEventListener(BONUS_BALANCE_UPDATED_EVENT, handleBonusUpdate);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(BONUS_BALANCE_UPDATED_EVENT, handleBonusUpdate);
    };
  }, []);

  const submitCashout = async () => {
    if (!userId) {
      setFeedback("Sign in again to cash your bonus.");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback("Enter a valid cashout amount.");
      return;
    }

    if (parsedAmount > availableBonus) {
      setFeedback("You cannot cash more than your available bonus balance.");
      return;
    }

    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
      setFeedback("Enter your bank name, account name, and account number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      await createBonusCashoutTransaction({
        userId,
        amount: parsedAmount,
        destinationDetails: {
          bankName: bankName.trim(),
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
        },
      });
      setBankName("");
      setAccountName("");
      setAccountNumber("");
      setAmount("");
      loadWallet(userId);
      notifyBonusBalanceUpdated(userId);
      setFeedback("Bonus cashout submitted. Admin will review it shortly.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to submit bonus cashout.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KycVerificationGate title="Verify your account to cash your bonus">
    <div className="min-w-0 rounded-[26px] border border-[#e6ece8] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)] sm:rounded-[30px] sm:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h3 className="text-2xl font-semibold text-slate-900">Cash Bonus</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Request a payout from your available referral and threshold bonus balance anytime (no minimum amount restriction).
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-emerald-50 px-4 py-3 text-left md:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Available
          </p>
          <p className="mt-1 text-lg font-semibold text-[#0f7b36]">
            {formatCurrency(availableBonus, "NGN")}
          </p>
        </div>
      </div>

      {feedback ? (
        <p className="mt-4 rounded-2xl bg-[#f6faf7] px-4 py-3 text-sm text-slate-700">
          {feedback}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Amount
          </span>
          <input
            type="number"
            min="0.01"
            step="any"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
            placeholder="Enter amount"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Bank Name
          </span>
          <input
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
            className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
            placeholder="Enter bank name"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Account Name
          </span>
          <input
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
            placeholder="Enter account name"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Account Number
          </span>
          <input
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
            className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
            placeholder="Enter account number"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={isSubmitting || availableBonus <= 0}
        onClick={submitCashout}
        className="mt-5 w-full rounded-2xl bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#116f34] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Request Bonus Cashout"}
      </button>
    </div>
    </KycVerificationGate>
  );
}
