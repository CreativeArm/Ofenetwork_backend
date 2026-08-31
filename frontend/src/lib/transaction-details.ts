import type { BackendTransaction } from "./admin-backend";

export type TransactionDetailRow = {
  label: string;
  value: string;
};

const hiddenDetailKeys = new Set([
  "bonusCreditBreakdown",
]);

function prettifyKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function referenceLabelForService(service: string, fallback = "Reference") {
  const normalized = service.toLowerCase();

  if (normalized.includes("deriv")) {
    return "Client Nickname";
  }
  if (normalized.includes("crypto")) {
    return "Crypto Address";
  }
  if (normalized.includes("paypal")) {
    return "PayPal Email Address";
  }
  if (normalized.includes("skrill")) {
    return "Skrill Email Address";
  }
  if (normalized.includes("payoneer")) {
    return "Payoneer Email Address";
  }
  if (normalized.includes("zelle")) {
    return "Zelle Phone or Email";
  }

  return fallback;
}

export function buildDepositDetails(service: string, label: string, value?: string) {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return undefined;
  }

  return {
    [referenceLabelForService(service, label)]: trimmedValue,
  };
}

export function getTransactionDetailRows(
  transaction: Pick<BackendTransaction, "service" | "reference" | "destinationDetails">,
) {
  const rows: TransactionDetailRow[] = [];

  if (transaction.destinationDetails) {
    for (const [key, rawValue] of Object.entries(transaction.destinationDetails)) {
      if (!rawValue || hiddenDetailKeys.has(key)) {
        continue;
      }

      rows.push({
        label: prettifyKey(key),
        value: rawValue,
      });
    }
  }

  if (transaction.reference) {
    const exists = rows.some(
      (row) => row.value.toLowerCase() === transaction.reference?.toLowerCase(),
    );
    if (!exists) {
      rows.push({
        label: referenceLabelForService(transaction.service),
        value: transaction.reference,
      });
    }
  }

  return rows;
}

export function getPrimaryTransactionDetail(
  transaction: Pick<BackendTransaction, "service" | "reference" | "destinationDetails">,
) {
  return getTransactionDetailRows(transaction)[0] ?? null;
}
