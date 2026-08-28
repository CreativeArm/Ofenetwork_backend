export const BONUS_BALANCE_UPDATED_EVENT = "ofenetwork:bonus-balance-updated";

export function notifyBonusBalanceUpdated(userId?: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(BONUS_BALANCE_UPDATED_EVENT, {
      detail: userId ? { userId } : undefined,
    }),
  );
}
