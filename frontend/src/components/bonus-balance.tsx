"use client";

import { useEffect, useState } from "react";
import {
  calculateBonusBalance,
  fetchUserWallet,
  formatCurrency,
  getCachedApi,
  type BackendWallet,
} from "../lib/admin-backend";
import { BONUS_BALANCE_UPDATED_EVENT } from "../lib/bonus-events";

type StoredUser = {
  id?: string;
};

function getInitialBonusBalance(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const rawUser = window.localStorage.getItem("ofe_user");
    const parsed = rawUser ? (JSON.parse(rawUser) as StoredUser) : null;
    if (!parsed?.id) return fallback;
    const cachedWallet = getCachedApi<BackendWallet>(`/wallet/${encodeURIComponent(parsed.id)}`);
    if (cachedWallet) {
      return formatCurrency(calculateBonusBalance(cachedWallet), "NGN");
    }
  } catch {}
  return fallback;
}

export function BonusBalanceAmount({
  fallback = "N0.00",
}: {
  fallback?: string;
}) {
  const [balance, setBalance] = useState<string>(() => getInitialBonusBalance(fallback));

  useEffect(() => {
    let isMounted = true;

    const loadBalance = async () => {
      try {
        const rawUser = window.localStorage.getItem("ofe_user");
        const parsed = rawUser ? (JSON.parse(rawUser) as StoredUser) : null;

        if (!parsed?.id) {
          if (isMounted) {
            setBalance(fallback);
          }
          return;
        }

        // Show cached immediately if not set
        const cached = getCachedApi<BackendWallet>(`/wallet/${encodeURIComponent(parsed.id)}`);
        if (cached && isMounted) {
          setBalance(formatCurrency(calculateBonusBalance(cached), "NGN"));
        }

        const wallet = await fetchUserWallet(parsed.id);
        if (isMounted) {
          setBalance(formatCurrency(calculateBonusBalance(wallet), "NGN"));
        }
      } catch {
        // Keep current balance
      }
    };

    const handleBonusUpdate = (event: Event) => {
      try {
        const rawUser = window.localStorage.getItem("ofe_user");
        const parsed = rawUser ? (JSON.parse(rawUser) as StoredUser) : null;
        const updatedUserId = (event as CustomEvent<{ userId?: string }>).detail
          ?.userId;

        if (!updatedUserId || updatedUserId === parsed?.id) {
          loadBalance();
        }
      } catch {
        loadBalance();
      }
    };

    loadBalance();
    const interval = window.setInterval(loadBalance, 10000);
    window.addEventListener("focus", loadBalance);
    window.addEventListener(BONUS_BALANCE_UPDATED_EVENT, handleBonusUpdate);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", loadBalance);
      window.removeEventListener(BONUS_BALANCE_UPDATED_EVENT, handleBonusUpdate);
    };
  }, [fallback]);

  return <>{balance}</>;
}
