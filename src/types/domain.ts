export type Role = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED";
export type Currency = "NGN" | "USD";
export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "WALLET_CREDIT"
  | "WALLET_DEBIT"
  | "BUY4ME_PAYMENT";
export type TransactionStatus = "PENDING" | "CONFIRMED" | "REJECTED";
export type WalletCreditType =
  | "ADMIN_CREDIT"
  | "REFERRAL_BONUS"
  | "THRESHOLD_BONUS"
  | "PROMOTIONAL_BONUS"
  | "CASHBACK";
export type Buy4MeStatus = "PENDING" | "PROCESSING" | "COMPLETED";

export interface WalletCredit {
  id: string;
  amount: number;
  currency: Currency;
  type: WalletCreditType;
  expiresAt: string;
  consumedAmount: number;
  createdAt: string;
}

export interface Wallet {
  userId: string;
  balances: Record<Currency, number>;
  credits: WalletCredit[];
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  service: string;
  amount: number;
  currency: Currency;
  nairaEquivalent: number;
  status: TransactionStatus;
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

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Buy4MeOrder {
  id: string;
  userId: string;
  productLink: string;
  productDetails: string;
  productCost?: number;
  shippingCost?: number;
  serviceCharge?: number;
  totalCost?: number;
  status: Buy4MeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
