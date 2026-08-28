"use client";

import { useEffect, useState } from "react";
import { RatesBoard } from "./rates-board";
import { mapBackendRatesToBoard } from "../lib/admin-backend";
import { getDefaultPublicRates, loadPublicRates } from "../lib/public-rates";

interface RateItem {
  id: string;
  name: string;
  deposit: string;
  withdrawal: string;
}

interface LiveRatesBoardProps {
  marquee?: boolean;
}

export function LiveRatesBoard({ marquee = false }: LiveRatesBoardProps) {
  const [rates, setRates] = useState<RateItem[]>(() => mapBackendRatesToBoard(getDefaultPublicRates()));
  useEffect(() => {
    loadPublicRates().then(({ rates: fetched }) => setRates(mapBackendRatesToBoard(fetched)));
  }, []);

  return <RatesBoard rates={rates} marquee={marquee} />;
}
