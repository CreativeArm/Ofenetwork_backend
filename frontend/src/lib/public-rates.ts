import { fetchRates, type BackendRate } from "./admin-backend";
import { homeRates } from "./mock-data";

const RATE_CACHE_KEY = "ofenetwork-public-rates";

export function getDefaultPublicRates(): BackendRate[] {
  const now = new Date().toISOString();
  return homeRates.map((rate, index) => ({
    id: `default-${index}`,
    service: rate.name,
    depositRate: rate.deposit,
    withdrawalRate: rate.withdrawal,
    sortOrder: index,
    createdAt: now,
    updatedAt: now,
  }));
}

function readCachedRates(): BackendRate[] | null {
  try {
    const raw = window.localStorage.getItem(RATE_CACHE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed as BackendRate[] : null;
  } catch {
    return null;
  }
}

function cacheRates(rates: BackendRate[]) {
  try {
    window.localStorage.setItem(RATE_CACHE_KEY, JSON.stringify(rates));
  } catch {
    // Private browsing or a full storage quota should not stop rates rendering.
  }
}

export async function loadPublicRates() {
  try {
    const rates = await fetchRates();
    if (rates.length > 0) {
      cacheRates(rates);
      return { rates, isFallback: false };
    }
  } catch {
    // Use the most recently confirmed rates, then the bundled safe defaults.
  }

  return { rates: readCachedRates() ?? getDefaultPublicRates(), isFallback: true };
}
