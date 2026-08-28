"use client";

import { useEffect, useState } from "react";
import {
  fetchRates,
  getCachedApi,
  mapBackendRatesToBoard,
  type BackendRate,
} from "../lib/admin-backend";
import { RatesBoard } from "./rates-board";

type RateItem = {
  id: string;
  name: string;
  deposit: string;
  withdrawal: string;
};

function getInitialRates(): RateItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = getCachedApi<BackendRate[]>("/rates");
    if (cached && cached.length > 0) {
      return mapBackendRatesToBoard(cached);
    }
  } catch {}
  return null;
}

export function AdminLiveRatesBoard() {
  const [rates, setRates] = useState<RateItem[] | null>(() => getInitialRates());
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    fetchRates()
      .then((items) => {
        setRates(mapBackendRatesToBoard(items));
        setLoadFailed(false);
      })
      .catch(() => {
        if (!rates || rates.length === 0) {
          setLoadFailed(true);
          setRates([]);
        }
      });
  }, []);

  if (rates === null) {
    return <p className="py-6 text-sm text-slate-500">Loading live rates…</p>;
  }

  if (loadFailed || rates.length === 0) {
    return <p className="py-6 text-sm text-slate-500">Live rates are temporarily unavailable.</p>;
  }

  return <RatesBoard rates={rates} admin actionHref="/admin/rates" />;
}
