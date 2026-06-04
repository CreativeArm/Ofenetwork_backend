import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { UsersService } from "../users/users.service";
import { WalletService } from "../wallet/wallet.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";

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
    const cachedMetrics = await this.redis.getJson<{
      totalUsers: number;
      totalDeposits: number;
      totalWithdrawals: number;
      totalTransactions: number;
      pendingRequests: number;
      recentActivities: Array<{
        id: string;
        actorId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata?: unknown;
        createdAt: string;
      }>;
    }>(cacheKey);

    if (cachedMetrics) {
      return cachedMetrics;
    }

    const [totalUsers, totalTransactions, pendingRequests, confirmedTransactions, recentActivities] =
      await Promise.all([
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

    const metrics = {
      totalUsers,
      totalDeposits,
      totalWithdrawals,
      totalTransactions,
      pendingRequests,
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
