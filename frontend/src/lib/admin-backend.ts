const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:4000/api";

export type BackendKycStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface BackendDashboardMetrics {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransactions: number;
  totalBuy4MeOrders?: number;
  pendingRequests: number;
  pendingDeposits?: number;
  pendingWithdrawals?: number;
  pendingBuy4Me?: number;
  unverifiedUsers?: number;
  pendingKycCount?: number;
  verifiedUsers?: number;
  recentUsers?: Array<{
    id: string;
    fullName: string;
    email: string;
    kycStatus: string;
    createdAt: string;
  }>;
  monthlyOverview?: Array<{
    key: string;
    label: string;
    deposits: number;
    withdrawals: number;
    buy4me: number;
  }>;
  buy4meStatusBreakdown?: Array<{
    label: string;
    value: number;
    color: string;
    chartColor: string;
  }>;
  recentActivities: Array<{
    id: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: unknown;
    createdAt: string;
  }>;
  recentTransactions?: Array<{
    id: string;
    userId: string;
    userFullName?: string;
    userEmail?: string;
    userKycStatus?: string;
    type: string;
    service: string;
    amount: number;
    currency: "NGN" | "USD";
    nairaEquivalent: number;
    status: "PENDING" | "CONFIRMED" | "REJECTED";
    reference?: string;
    proofOfPaymentUrl?: string;
    destinationDetails?: Record<string, string>;
    createdAt: string;
  }>;
}

export interface BackendTransaction {
  id: string;
  userId: string;
  userFullName?: string;
  userEmail?: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "WALLET_CREDIT" | "WALLET_DEBIT" | "BUY4ME_PAYMENT";
  service: string;
  amount: number;
  currency: "NGN" | "USD";
  nairaEquivalent: number;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  reference?: string;
  proofOfPaymentUrl?: string;
  destinationDetails?: Record<string, string>;
  adminActionHistory: Array<{
    action: string;
    actorId: string;
    note?: string;
    at: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  profileImageUrl?: string;
  kycStatus?: BackendKycStatus;
  kycDocumentType?: string;
  kycDocumentUrl?: string;
  kycAdminNote?: string;
  kycSubmittedAt?: string;
  kycReviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BackendWallet {
  userId: string;
  balances: Record<"NGN" | "USD", number>;
  credits: Array<{
    id: string;
    amount: number;
    currency: "NGN" | "USD";
    type:
      | "ADMIN_CREDIT"
      | "REFERRAL_BONUS"
      | "THRESHOLD_BONUS"
      | "PROMOTIONAL_BONUS"
      | "CASHBACK";
    expiresAt: string;
    consumedAmount: number;
    createdAt: string;
  }>;
}

export interface BackendAdminUser extends BackendUser {
  wallet?: BackendWallet;
  transactions?: BackendTransaction[];
}

export interface BackendBuy4MeOrder {
  id: string;
  userId: string;
  productLink: string;
  productDetails: string;
  productCost?: number;
  shippingCost?: number;
  serviceCharge?: number;
  totalCost?: number;
  paymentMethod?: string;
  proofOfPaymentUrl?: string;
  timelineUpdate?: string;
  adminNote?: string;
  status:
    | "PROCESSING"
    | "AWAITING_PAYMENT"
    | "PAYMENT_SUBMITTED"
    | "PURCHASING"
    | "SHIPPED"
    | "COMPLETED"
    | "CANCELLED"
    | "ISSUE";
  createdAt: string;
  updatedAt: string;
}

export interface BackendRate {
  id: string;
  service: string;
  depositRate: string;
  withdrawalRate: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackendTestimonial {
  id: string;
  name: string;
  service: string;
  text: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type BackendSupportTicketStatus = "OPEN" | "PENDING_USER" | "RESOLVED";
export type BackendSupportTicketPriority = "LOW" | "MEDIUM" | "HIGH";

export interface BackendSupportTicket {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  subject: string;
  topic: string;
  message: string;
  status: BackendSupportTicketStatus;
  priority: BackendSupportTicketPriority;
  owner: string;
  channel: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  conversation: Array<{
    sender: string;
    time: string;
    text: string;
  }>;
}

const SWR_STORAGE_PREFIX = "ofe_swr:";
const memorySwrCache = new Map<string, { data: unknown; timestamp: number }>();
const inFlightRequests = new Map<string, Promise<unknown>>();

export function getCachedApi<T>(path: string): T | null {
  const inMem = memorySwrCache.get(path);
  if (inMem) {
    return inMem.data as T;
  }
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(SWR_STORAGE_PREFIX + path);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; timestamp: number };
    if (parsed && typeof parsed === "object" && "data" in parsed) {
      memorySwrCache.set(path, parsed);
      return parsed.data;
    }
    return null;
  } catch {
    return null;
  }
}

export function setCachedApi<T>(path: string, data: T) {
  const entry = { data, timestamp: Date.now() };
  memorySwrCache.set(path, entry);
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(SWR_STORAGE_PREFIX + path, JSON.stringify(entry));
  } catch {
    // Ignore storage quota errors
  }
}

export function invalidateApiCache(pattern?: string | RegExp) {
  if (!pattern) {
    memorySwrCache.clear();
    if (typeof window !== "undefined") {
      try {
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const key = window.localStorage.key(i);
          if (key?.startsWith(SWR_STORAGE_PREFIX)) {
            window.localStorage.removeItem(key);
          }
        }
      } catch {
        // Ignore
      }
    }
    return;
  }

  const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
  for (const key of memorySwrCache.keys()) {
    if (regex.test(key)) {
      memorySwrCache.delete(key);
    }
  }

  if (typeof window !== "undefined") {
    try {
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const fullKey = window.localStorage.key(i);
        if (fullKey?.startsWith(SWR_STORAGE_PREFIX)) {
          const path = fullKey.slice(SWR_STORAGE_PREFIX.length);
          if (regex.test(path)) {
            window.localStorage.removeItem(fullKey);
          }
        }
      }
    } catch {
      // Ignore
    }
  }
}

async function fetchApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isGet = !init.method || init.method.toUpperCase() === "GET";

  if (isGet && inFlightRequests.has(path)) {
    return inFlightRequests.get(path) as Promise<T>;
  }

  const fetchPromise = (async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        signal: init.signal ?? controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed for ${path}: ${response.status}`);
      }

      const data = (await response.json()) as T;
      if (isGet) {
        setCachedApi(path, data);
      }
      return data;
    } finally {
      window.clearTimeout(timeout);
      if (isGet) {
        inFlightRequests.delete(path);
      }
    }
  })();

  if (isGet) {
    inFlightRequests.set(path, fetchPromise);
  }

  return fetchPromise;
}

async function mutateApi<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const rawMessage = await response.text();
    let errorMessage = rawMessage;
    try {
      const parsed = JSON.parse(rawMessage);
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.message)) {
          errorMessage = parsed.message.join(", ");
        } else if (typeof parsed.message === "string") {
          errorMessage = parsed.message;
        }
      }
    } catch {
      // Keep raw message if not JSON
    }
    throw new Error(errorMessage || `Request failed for ${path}: ${response.status}`);
  }

  if (path.includes("/rates")) {
    invalidateApiCache(/^\/rates/);
  } else if (path.includes("/transactions") || path.includes("/wallet")) {
    invalidateApiCache(/\/(transactions|wallet|admin\/dashboard|admin\/search-users)/);
  } else if (path.includes("/buy4me")) {
    invalidateApiCache(/\/(buy4me|admin\/dashboard)/);
  } else if (path.includes("/kyc") || path.includes("/users")) {
    invalidateApiCache(/\/(users|kyc|admin\/dashboard)/);
  } else {
    invalidateApiCache();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchAdminDashboardMetrics() {
  return fetchApi<BackendDashboardMetrics>("/admin/dashboard");
}

export async function fetchAdminTransactions() {
  return fetchApi<BackendTransaction[]>("/transactions");
}

export async function fetchUserTransactions(userId: string) {
  return fetchApi<BackendTransaction[]>(
    `/transactions?userId=${encodeURIComponent(userId)}`,
  );
}

export async function createDepositTransaction(payload: {
  userId: string;
  service: string;
  amount: number;
  currency: "NGN" | "USD";
  nairaEquivalent: number;
  reference?: string;
  destinationDetails?: Record<string, string>;
  proofOfPaymentUrl?: string;
}) {
  return mutateApi<BackendTransaction>("/transactions/deposit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createWithdrawalTransaction(payload: {
  userId: string;
  service: string;
  amount: number;
  currency: "NGN" | "USD";
  nairaEquivalent: number;
  destinationDetails: Record<string, string>;
  proofOfPaymentUrl?: string;
}) {
  return mutateApi<BackendTransaction>("/transactions/withdrawal", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createBonusCashoutTransaction(payload: {
  userId: string;
  amount: number;
  destinationDetails: Record<string, string>;
}) {
  return mutateApi<BackendTransaction>("/transactions/bonus-cashout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminUsers() {
  return fetchApi<BackendAdminUser[]>("/admin/search-users?query=");
}

export async function fetchUserProfile(userId: string) {
  return fetchApi<BackendUser>(`/users/${encodeURIComponent(userId)}`);
}

export async function updateUserProfilePicture(
  userId: string,
  profileImageUrl: string | null,
) {
  return mutateApi<BackendUser>(
    `/users/${encodeURIComponent(userId)}/profile-picture`,
    {
      method: "PATCH",
      body: JSON.stringify({ profileImageUrl }),
    },
  );
}

export async function submitKyc(payload: {
  userId: string;
  documentType: string;
  documentUrl: string;
  notes?: string;
}) {
  return mutateApi<BackendUser>("/kyc/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateKycStatus(payload: {
  userId: string;
  status: BackendKycStatus;
  actorId: string;
  note?: string;
}) {
  return mutateApi<BackendUser>(`/kyc/${encodeURIComponent(payload.userId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: payload.status,
      actorId: payload.actorId,
      note: payload.note,
    }),
  });
}

export async function fetchUserWallet(userId: string) {
  return fetchApi<BackendWallet>(`/wallet/${encodeURIComponent(userId)}`);
}

export function calculateBonusBalance(wallet?: BackendWallet | null) {
  if (!wallet) {
    return 0;
  }

  return wallet.credits
    .filter(
      (credit) =>
        credit.currency === "NGN" &&
        (credit.type === "REFERRAL_BONUS" || credit.type === "THRESHOLD_BONUS"),
    )
    .reduce(
      (sum, credit) => sum + Math.max(0, credit.amount - credit.consumedAmount),
      0,
    );
}

export async function addUserBonus(payload: {
  actorId: string;
  userId: string;
  amount: number;
  currency: "NGN" | "USD";
  type: "REFERRAL_BONUS" | "THRESHOLD_BONUS";
}) {
  return mutateApi<BackendWallet>("/admin/wallet-credit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function removeUserBonus(payload: {
  actorId: string;
  userId: string;
  creditId: string;
}) {
  return mutateApi<BackendWallet>(
    `/admin/users/${payload.userId}/bonus/${payload.creditId}`,
    {
      method: "DELETE",
      body: JSON.stringify({ actorId: payload.actorId }),
    },
  );
}

export async function fetchAdminBuy4MeOrders() {
  return fetchApi<BackendBuy4MeOrder[]>("/buy4me");
}

export async function fetchUserBuy4MeOrders(userId: string) {
  return fetchApi<BackendBuy4MeOrder[]>(
    `/buy4me?userId=${encodeURIComponent(userId)}`,
  );
}

export async function createBuy4MeOrder(payload: {
  userId: string;
  productLink: string;
  productDetails: string;
}) {
  return mutateApi<BackendBuy4MeOrder>("/buy4me", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitBuy4MePayment(
  id: string,
  payload: {
    paymentMethod: string;
    proofOfPaymentUrl?: string;
  },
) {
  return mutateApi<BackendBuy4MeOrder>(`/buy4me/${id}/payment`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function cancelBuy4MeOrder(id: string, reason?: string) {
  return mutateApi<BackendBuy4MeOrder>(`/buy4me/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function priceBuy4MeOrder(
  id: string,
  payload: {
    actorId: string;
    productCost: number;
    shippingCost: number;
    serviceCharge: number;
  },
) {
  return mutateApi<BackendBuy4MeOrder>(`/buy4me/${id}/price`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateBuy4MeStatus(
  id: string,
  payload: {
    actorId: string;
    status:
      | "PROCESSING"
      | "AWAITING_PAYMENT"
      | "PAYMENT_SUBMITTED"
      | "PURCHASING"
      | "SHIPPED"
      | "COMPLETED"
      | "CANCELLED"
      | "ISSUE";
    timelineUpdate?: string;
    adminNote?: string;
  },
) {
  return mutateApi<BackendBuy4MeOrder>(`/buy4me/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchRates() {
  // Hosted services can take a few seconds to wake after inactivity. Retry a
  // transient connection failure once so a brief cold start does not blank the
  // public rate board.
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      return await fetchApi<BackendRate[]>("/rates", { signal: controller.signal });
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        await new Promise((resolve) => window.setTimeout(resolve, 1_000));
      }
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to load rates.");
}

export async function fetchTestimonials(status?: BackendTestimonial["status"]) {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetchApi<BackendTestimonial[]>(`/testimonials${suffix}`);
}

export async function fetchSupportTickets(status?: BackendSupportTicketStatus) {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetchApi<BackendSupportTicket[]>(`/support/tickets${suffix}`);
}

export async function updateSupportTicket(
  id: string,
  payload: {
    status?: BackendSupportTicketStatus;
    owner?: string;
    priority?: BackendSupportTicketPriority;
  },
) {
  return mutateApi<BackendSupportTicket>(`/support/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateTestimonialStatus(
  id: string,
  status: BackendTestimonial["status"],
) {
  return mutateApi<BackendTestimonial>(`/testimonials/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function createRate(payload: {
  service: string;
  depositRate: string;
  withdrawalRate: string;
  sortOrder?: number;
}) {
  return mutateApi<BackendRate>("/rates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRate(
  id: string,
  payload: {
    service?: string;
    depositRate?: string;
    withdrawalRate?: string;
    sortOrder?: number;
  },
) {
  return mutateApi<BackendRate>(`/rates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteRate(id: string) {
  return mutateApi<{ success: boolean }>(`/rates/${id}`, {
    method: "DELETE",
  });
}

export function mapBackendRatesToBoard(
  rates: BackendRate[],
): Array<{ id: string; name: string; deposit: string; withdrawal: string }> {
  return rates.map((rate) => ({
    id: rate.id,
    name: rate.service,
    deposit: rate.depositRate,
    withdrawal: rate.withdrawalRate,
  }));
}

export function formatCurrency(amount: number, currency: "NGN" | "USD" = "NGN") {
  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
  }).format(amount);

  return formatted.replace(/^([^\d\s]+)(\d)/, "$1 $2");
}

export function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "Just now";
  }

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.max(1, Math.floor(diffMs / day));
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function buildProofPlaceholder(id: string, service: string, amount: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
      <rect width="900" height="560" rx="28" fill="#f8fafc" />
      <rect x="44" y="44" width="812" height="472" rx="24" fill="#ffffff" stroke="#dbe5df" stroke-width="3" />
      <text x="72" y="112" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">${id}</text>
      <text x="72" y="170" fill="#475569" font-family="Arial, Helvetica, sans-serif" font-size="24">Service: ${service}</text>
      <text x="72" y="214" fill="#475569" font-family="Arial, Helvetica, sans-serif" font-size="24">Amount: ${amount}</text>
      <text x="450" y="452" text-anchor="middle" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="22">Generated preview for admin review</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
