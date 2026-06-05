import { Injectable } from "@nestjs/common";
import { Buy4MeStatus, Prisma, TransactionType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { UsersService } from "../users/users.service";
import { WalletService } from "../wallet/wallet.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";

const buy4MeStatusSegments: Array<{
  label: string;
  statuses: Buy4MeStatus[];
  color: string;
  chartColor: string;
}> = [
  {
    label: "Processing",
    statuses: ["PROCESSING", "PAYMENT_SUBMITTED", "PURCHASING", "ISSUE"],
    color: "bg-orange-500",
    chartColor: "#f97316",
  },
  {
    label: "Awaiting Payment",
    statuses: ["AWAITING_PAYMENT"],
    color: "bg-blue-600",
    chartColor: "#2563eb",
  },
  {
    label: "Shipped",
    statuses: ["SHIPPED"],
    color: "bg-sky-500",
    chartColor: "#0ea5e9",
  },
  {
    label: "Delivered",
    statuses: ["COMPLETED"],
    color: "bg-emerald-600",
    chartColor: "#059669",
  },
  {
    label: "Cancelled",
    statuses: ["CANCELLED"],
    color: "bg-rose-500",
    chartColor: "#e11d48",
  },
];

export interface DashboardMetrics {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransactions: number;
  totalBuy4MeOrders: number;
  pendingRequests: number;
  monthlyOverview: Array<{
    key: string;
    label: string;
    deposits: number;
    withdrawals: number;
    buy4me: number;
  }>;
  buy4meStatusBreakdown: Array<{
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
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function buildMonthlyOverview(
  startDate: Date,
  transactions: Array<{
    type: TransactionType;
    nairaEquivalent: Prisma.Decimal;
    createdAt: Date;
  }>,
  buy4meOrders: Array<{
    totalCost: Prisma.Decimal | null;
    createdAt: Date;
  }>,
) {
  const formatter = new Intl.DateTimeFormat("en-NG", { month: "short" });
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(
      Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + index, 1),
    );

    return {
      key: monthKey(date),
      label: formatter.format(date),
      deposits: 0,
      withdrawals: 0,
      buy4me: 0,
    };
  });
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  transactions.forEach((transaction) => {
    const bucket = bucketMap.get(monthKey(transaction.createdAt));
    if (!bucket) {
      return;
    }

    if (transaction.type === "DEPOSIT") {
      bucket.deposits += transaction.nairaEquivalent.toNumber();
      return;
    }

    bucket.withdrawals += transaction.nairaEquivalent.toNumber();
  });

  buy4meOrders.forEach((order) => {
    const bucket = bucketMap.get(monthKey(order.createdAt));
    if (!bucket || !order.totalCost) {
      return;
    }

    bucket.buy4me += order.totalCost.toNumber();
  });

  return buckets.map((bucket) => ({
    ...bucket,
    deposits: roundMoney(bucket.deposits),
    withdrawals: roundMoney(bucket.withdrawals),
    buy4me: roundMoney(bucket.buy4me),
  }));
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getDashboardMetrics() {
    const cacheKey = "admin:dashboard:metrics";
    const cachedMetrics = await this.redis.getJson<DashboardMetrics>(cacheKey);

    if (cachedMetrics) {
      return cachedMetrics;
    }

    const now = new Date();
    const monthlyStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
    );

    const [
      totalUsers,
      totalTransactions,
      pendingRequests,
      confirmedTransactions,
      monthlyTransactions,
      monthlyBuy4MeOrders,
      buy4MeStatusCounts,
      recentActivities,
    ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.transaction.count(),
        this.prisma.transaction.count({
          where: { status: "PENDING" },
        }),
        this.prisma.transaction.findMany({
          where: {
            status: "CONFIRMED",
            type: {
              in: ["DEPOSIT", "WITHDRAWAL"],
            },
          },
          select: {
            type: true,
            nairaEquivalent: true,
          },
        }),
        this.prisma.transaction.findMany({
          where: {
            createdAt: { gte: monthlyStart },
            status: "CONFIRMED",
            type: {
              in: ["DEPOSIT", "WITHDRAWAL"],
            },
          },
          select: {
            type: true,
            nairaEquivalent: true,
            createdAt: true,
          },
        }),
        this.prisma.buy4MeOrder.findMany({
          where: {
            createdAt: { gte: monthlyStart },
            status: { not: "CANCELLED" },
            totalCost: { not: null },
          },
          select: {
            totalCost: true,
            createdAt: true,
          },
        }),
        this.prisma.buy4MeOrder.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
        this.prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

    const totalDeposits = confirmedTransactions
      .filter((item) => item.type === "DEPOSIT")
      .reduce((sum, item) => sum + item.nairaEquivalent.toNumber(), 0);

    const totalWithdrawals = confirmedTransactions
      .filter((item) => item.type === "WITHDRAWAL")
      .reduce((sum, item) => sum + item.nairaEquivalent.toNumber(), 0);

    const statusCountMap = new Map<Buy4MeStatus, number>(
      buy4MeStatusCounts.map((item) => [item.status, item._count._all]),
    );
    const buy4meStatusBreakdown = buy4MeStatusSegments.map((segment) => ({
      label: segment.label,
      value: segment.statuses.reduce(
        (sum, status) => sum + (statusCountMap.get(status) ?? 0),
        0,
      ),
      color: segment.color,
      chartColor: segment.chartColor,
    }));
    const totalBuy4MeOrders = buy4meStatusBreakdown.reduce(
      (sum, item) => sum + item.value,
      0,
    );

    const metrics: DashboardMetrics = {
      totalUsers,
      totalDeposits,
      totalWithdrawals,
      totalTransactions,
      totalBuy4MeOrders,
      pendingRequests,
      monthlyOverview: buildMonthlyOverview(
        monthlyStart,
        monthlyTransactions,
        monthlyBuy4MeOrders,
      ),
      buy4meStatusBreakdown,
      recentActivities: recentActivities.map((entry) => ({
        id: entry.id,
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata ?? undefined,
        createdAt: entry.createdAt.toISOString(),
      })),
    };

    await this.redis.setJson(cacheKey, metrics, 30);

    return metrics;
  }

  creditWallet(payload: {
    actorId: string;
    userId: string;
    amount: number;
    currency: "NGN" | "USD";
    type:
      | "ADMIN_CREDIT"
      | "PROMOTIONAL_BONUS"
      | "REFERRAL_BONUS"
      | "THRESHOLD_BONUS"
      | "CASHBACK";
  }) {
    return this.addBonus(payload);
  }

  async addBonus(payload: {
    actorId: string;
    userId: string;
    amount: number;
    currency: "NGN" | "USD";
    type:
      | "ADMIN_CREDIT"
      | "PROMOTIONAL_BONUS"
      | "REFERRAL_BONUS"
      | "THRESHOLD_BONUS"
      | "CASHBACK";
  }) {
    const wallet = await this.walletService.creditWallet(payload);
    await this.notificationsService.create(
      payload.userId,
      "Bonus added",
      `${payload.amount} ${payload.currency} has been added to your bonus balance.`,
    );
    await this.auditService.log(payload.actorId, "BONUS_ADDED", "user", payload.userId, {
      amount: payload.amount,
      currency: payload.currency,
      type: payload.type,
    });
    await Promise.all([
      this.redis.delete("admin:dashboard:metrics"),
      this.redis.delete("admin:user-search:"),
    ]);
    return wallet;
  }

  async removeBonus(payload: {
    actorId: string;
    userId: string;
    creditId: string;
  }) {
    const wallet = await this.walletService.removeCredit(
      payload.userId,
      payload.creditId,
    );
    await this.notificationsService.create(
      payload.userId,
      "Bonus removed",
      "An admin removed a bonus from your account.",
    );
    await this.auditService.log(payload.actorId, "BONUS_REMOVED", "user", payload.userId, {
      creditId: payload.creditId,
    });
    await Promise.all([
      this.redis.delete("admin:dashboard:metrics"),
      this.redis.delete("admin:user-search:"),
    ]);
    return wallet;
  }

  async searchUsers(query: string) {
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `admin:user-search:${normalizedQuery}`;
    const cachedUsers = await this.redis.getJson<unknown[]>(cacheKey);
    if (cachedUsers) {
      return cachedUsers;
    }

    const users = (await this.usersService.search(query)).filter(
      (user) => user.role === "USER",
    );

    const result = await Promise.all(
      users.map(async (user) => {
        const transactions = await this.prisma.transaction.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        });

        return {
        ...user,
        wallet: await this.walletService.getWallet(user.id),
          transactions: transactions.map((transaction) => ({
            id: transaction.id,
            userId: transaction.userId,
            type: transaction.type,
            service: transaction.service,
            amount: transaction.amount.toNumber(),
            currency: transaction.currency,
            nairaEquivalent: transaction.nairaEquivalent.toNumber(),
            status: transaction.status,
            reference: transaction.reference ?? undefined,
            proofOfPaymentUrl: transaction.proofOfPaymentUrl ?? undefined,
            destinationDetails:
              (transaction.destinationDetails as Record<string, string> | null) ?? undefined,
            adminActionHistory: Array.isArray(transaction.adminActionHistory)
              ? transaction.adminActionHistory
              : [],
            createdAt: transaction.createdAt.toISOString(),
            updatedAt: transaction.updatedAt.toISOString(),
          })),
        };
      }),
    );

    await this.redis.setJson(cacheKey, result, 15);

    return result;
  }
}
