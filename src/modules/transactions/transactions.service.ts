import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { KycStatus, Prisma, TransactionStatus, TransactionType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { CreateDepositDto } from "./dto/create-deposit.dto";
import { CreateWithdrawalDto } from "./dto/create-withdrawal.dto";
import { CreateBonusCashoutDto } from "./dto/create-bonus-cashout.dto";
import { WalletService } from "../wallet/wallet.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../audit/audit.service";
import { RatesService } from "../rates/rates.service";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
    private readonly ratesService: RatesService,
  ) {}

  private normalizeAdminActionHistory(value: Prisma.JsonValue | null) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((entry) => {
      const item = entry as Record<string, unknown>;
      return {
        action: typeof item.action === "string" ? item.action : "",
        actorId: typeof item.actorId === "string" ? item.actorId : "",
        note: typeof item.note === "string" ? item.note : undefined,
        at: typeof item.at === "string" ? item.at : "",
      };
    });
  }

  private serializeTransaction(transaction: {
    id: string;
    userId: string;
    type: TransactionType;
    service: string;
    amount: Prisma.Decimal;
    currency: "NGN" | "USD";
    nairaEquivalent: Prisma.Decimal;
    status: TransactionStatus;
    reference: string | null;
    proofOfPaymentUrl: string | null;
    destinationDetails: Prisma.JsonValue | null;
    adminActionHistory: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
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
      adminActionHistory: this.normalizeAdminActionHistory(transaction.adminActionHistory),
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };
  }

  private parseNgnRate(rateText?: string) {
    const match = rateText?.match(/(?:NGN|N)\s*([0-9,]+(?:\.[0-9]+)?)/i);
    if (!match) {
      return null;
    }

    const rate = Number.parseFloat(match[1].replace(/,/g, ""));
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  }

  private matchesServiceRate(serviceName: string, rateService: string) {
    const service = serviceName.toLowerCase();
    const rate = rateService.toLowerCase();
    return service === rate || rate.includes(service) || service.includes(rate);
  }

  private async calculateDepositNairaEquivalent(payload: CreateDepositDto) {
    if (payload.currency === "NGN") {
      return payload.amount;
    }

    const rates = await this.ratesService.list();
    const serviceRate = rates.find((rate) =>
      this.matchesServiceRate(payload.service, rate.service),
    );
    const depositRate = this.parseNgnRate(serviceRate?.depositRate);

    if (!depositRate) {
      throw new BadRequestException(
        `Deposit rate is not configured for ${payload.service}.`,
      );
    }

    return payload.amount * depositRate;
  }

  private async calculateWithdrawalNairaEquivalent(payload: CreateWithdrawalDto) {
    if (payload.currency === "NGN") {
      return payload.amount;
    }

    const rates = await this.ratesService.list();
    const serviceRate = rates.find((rate) =>
      this.matchesServiceRate(payload.service, rate.service),
    );
    const withdrawalRate = this.parseNgnRate(serviceRate?.withdrawalRate);

    if (!withdrawalRate) {
      throw new BadRequestException(
        `Withdrawal rate is not configured for ${payload.service}.`,
      );
    }

    return payload.amount * withdrawalRate;
  }

  private async ensureKycApproved(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.kycStatus !== KycStatus.APPROVED) {
      throw new ForbiddenException(
        "KYC verification is required before you can perform transactions.",
      );
    }
  }

  async createDeposit(payload: CreateDepositDto) {
    await this.ensureKycApproved(payload.userId);
    const nairaEquivalent = await this.calculateDepositNairaEquivalent(payload);

    const transaction = await this.prisma.transaction.create({
      data: {
        userId: payload.userId,
        type: "DEPOSIT",
        service: payload.service,
        amount: new Prisma.Decimal(payload.amount),
        currency: payload.currency,
        nairaEquivalent: new Prisma.Decimal(nairaEquivalent),
        status: "PENDING",
        reference: payload.reference,
        destinationDetails: payload.destinationDetails,
        proofOfPaymentUrl: payload.proofOfPaymentUrl,
        adminActionHistory: [],
      },
    });

    await this.notificationsService.create(
      payload.userId,
      "Deposit submitted",
      `Your ${payload.service} deposit is pending admin review.`,
    );
    await this.redis.delete("admin:dashboard:metrics");
    return this.serializeTransaction(transaction);
  }

  async createWithdrawal(payload: CreateWithdrawalDto) {
    await this.ensureKycApproved(payload.userId);
    const nairaEquivalent = await this.calculateWithdrawalNairaEquivalent(payload);

    await this.walletService.debitWallet(
      payload.userId,
      payload.amount,
      payload.currency,
    );

    const transaction = await this.prisma.transaction.create({
      data: {
        userId: payload.userId,
        type: "WITHDRAWAL",
        service: payload.service,
        amount: new Prisma.Decimal(payload.amount),
        currency: payload.currency,
        nairaEquivalent: new Prisma.Decimal(nairaEquivalent),
        status: "PENDING",
        destinationDetails: payload.destinationDetails,
        proofOfPaymentUrl: payload.proofOfPaymentUrl,
        adminActionHistory: [],
      },
    });

    await this.notificationsService.create(
      payload.userId,
      "Withdrawal requested",
      `Your ${payload.amount} ${payload.currency} withdrawal has been queued for admin processing.`,
    );
    await this.redis.delete("admin:dashboard:metrics");
    return this.serializeTransaction(transaction);
  }

  async createBonusCashout(payload: CreateBonusCashoutDto) {
    await this.ensureKycApproved(payload.userId);
    const { breakdown } = await this.walletService.debitBonusWallet(
      payload.userId,
      payload.amount,
    );

    const transaction = await this.prisma.transaction.create({
      data: {
        userId: payload.userId,
        type: "WITHDRAWAL",
        service: "Bonus Cashout",
        amount: new Prisma.Decimal(payload.amount),
        currency: "NGN",
        nairaEquivalent: new Prisma.Decimal(payload.amount),
        status: "PENDING",
        destinationDetails: {
          ...payload.destinationDetails,
          bonusCashout: "Yes",
          bonusCreditBreakdown: JSON.stringify(breakdown),
        },
        adminActionHistory: [],
      },
    });

    await this.notificationsService.create(
      payload.userId,
      "Bonus cashout requested",
      `Your ${payload.amount} NGN bonus cashout is pending admin review.`,
    );
    await this.redis.delete("admin:dashboard:metrics");
    return this.serializeTransaction(transaction);
  }

  async listForUser(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return transactions.map((transaction) => this.serializeTransaction(transaction));
  }

  async listAll() {
    const transactions = await this.prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
    });

    return transactions.map((transaction) => this.serializeTransaction(transaction));
  }

  async updateStatus(transactionId: string, status: "CONFIRMED" | "REJECTED", actorId: string, note?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    const nextHistory = [
      ...this.normalizeAdminActionHistory(transaction.adminActionHistory),
      {
      action: status,
      actorId,
      note,
        at: new Date().toISOString(),
      },
    ];

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        adminActionHistory: nextHistory,
      },
    });

    if (status === "CONFIRMED" && transaction.type === "DEPOSIT") {
      await this.walletService.creditWallet({
        userId: transaction.userId,
        amount: transaction.amount.toNumber(),
        currency: transaction.currency,
        type: "ADMIN_CREDIT",
      });
    }

    if (status === "REJECTED" && transaction.type === "WITHDRAWAL") {
      const destinationDetails =
        (transaction.destinationDetails as Record<string, string> | null) ?? {};
      const isBonusCashout = destinationDetails.bonusCashout === "Yes";

      if (isBonusCashout && destinationDetails.bonusCreditBreakdown) {
        let breakdown: Array<{
          type: "REFERRAL_BONUS" | "THRESHOLD_BONUS";
          amount: number;
        }> = [];
        try {
          breakdown = JSON.parse(destinationDetails.bonusCreditBreakdown) as Array<{
            type: "REFERRAL_BONUS" | "THRESHOLD_BONUS";
            amount: number;
          }>;
        } catch {
          breakdown = [{ type: "REFERRAL_BONUS", amount: transaction.amount.toNumber() }];
        }
        for (const entry of breakdown) {
          await this.walletService.creditWallet({
            userId: transaction.userId,
            amount: entry.amount,
            currency: "NGN",
            type: entry.type,
          });
        }
      } else {
        await this.walletService.creditWallet({
          userId: transaction.userId,
          amount: transaction.amount.toNumber(),
          currency: transaction.currency,
          type: "ADMIN_CREDIT",
        });
      }
    }

    await this.notificationsService.create(
      transaction.userId,
      `Transaction ${status.toLowerCase()}`,
      `${transaction.service} transaction ${transaction.id} is now ${status}.`,
    );
    await this.auditService.log(actorId, status, "transaction", transaction.id, { note });
    await this.redis.delete("admin:dashboard:metrics");

    return this.serializeTransaction(updatedTransaction);
  }
}
