import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { Currency, WalletCreditType } from "../../types/domain";

const BONUS_CREDIT_TYPES: WalletCreditType[] = [
  "REFERRAL_BONUS",
  "THRESHOLD_BONUS",
];

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  private mapWallet(wallet: {
    userId: string;
    availableNgn: Prisma.Decimal;
    availableUsd: Prisma.Decimal;
    credits: Array<{
      id: string;
      amount: Prisma.Decimal;
      currency: Currency;
      type: WalletCreditType;
      expiresAt: Date;
      consumedAmount: Prisma.Decimal;
      createdAt: Date;
    }>;
  }) {
    return {
      userId: wallet.userId,
      balances: {
        NGN: wallet.availableNgn.toNumber(),
        USD: wallet.availableUsd.toNumber(),
      },
      credits: wallet.credits.map((credit) => ({
        id: credit.id,
        amount: credit.amount.toNumber(),
        currency: credit.currency,
        type: credit.type,
        expiresAt: credit.expiresAt.toISOString(),
        consumedAmount: credit.consumedAmount.toNumber(),
        createdAt: credit.createdAt.toISOString(),
      })),
    };
  }

  async createWallet(userId: string) {
    const wallet = await this.prisma.wallet.create({
      data: {
        userId,
        availableNgn: new Prisma.Decimal(0),
        availableUsd: new Prisma.Decimal(0),
      },
      include: {
        credits: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return this.mapWallet(wallet);
  }

  async getWallet(userId: string) {
    await this.expireCredits(userId);
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        credits: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!wallet) {
      return this.createWallet(userId);
    }
    return this.mapWallet(wallet);
  }

  async creditWallet(params: {
    userId: string;
    amount: number;
    currency: Currency;
    type: WalletCreditType;
    expiresInDays?: number;
  }) {
    const wallet =
      (await this.prisma.wallet.findUnique({
        where: { userId: params.userId },
      })) ??
      (await this.prisma.wallet.create({
        data: {
          userId: params.userId,
          availableNgn: new Prisma.Decimal(0),
          availableUsd: new Prisma.Decimal(0),
        },
      }));

    const balanceField =
      params.currency === "NGN" ? "availableNgn" : "availableUsd";
    const expiresAt = new Date(
      Date.now() + (params.expiresInDays ?? 30) * 24 * 60 * 60 * 1000,
    );

    const updatedWallet = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: params.userId },
        data: {
          [balanceField]: {
            increment: new Prisma.Decimal(params.amount),
          },
        },
      });

      await tx.walletCredit.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(params.amount),
          currency: params.currency,
          type: params.type,
          consumedAmount: new Prisma.Decimal(0),
          expiresAt,
        },
      });

      return tx.wallet.findUnique({
        where: { userId: params.userId },
        include: {
          credits: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });

    if (!updatedWallet) {
      throw new NotFoundException("Wallet not found");
    }

    return this.mapWallet(updatedWallet);
  }

  async debitWallet(userId: string, amount: number, currency: Currency) {
    await this.expireCredits(userId);

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        credits: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    const currentBalance =
      currency === "NGN" ? wallet.availableNgn.toNumber() : wallet.availableUsd.toNumber();
    if (currentBalance < amount) {
      throw new BadRequestException("Insufficient wallet balance");
    }

    const updatedWallet = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: {
          [currency === "NGN" ? "availableNgn" : "availableUsd"]: {
            decrement: new Prisma.Decimal(amount),
          },
        },
      });

      let remaining = amount;
      for (const credit of wallet.credits.filter((item) => item.currency === currency)) {
        const usable = credit.amount.toNumber() - credit.consumedAmount.toNumber();
        if (usable <= 0) {
          continue;
        }

        const deduction = Math.min(usable, remaining);
        await tx.walletCredit.update({
          where: { id: credit.id },
          data: {
            consumedAmount: {
              increment: new Prisma.Decimal(deduction),
            },
          },
        });
        remaining -= deduction;

        if (remaining <= 0) {
          break;
        }
      }

      return tx.wallet.findUnique({
        where: { userId },
        include: {
          credits: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });

    if (!updatedWallet) {
      throw new NotFoundException("Wallet not found");
    }

    return this.mapWallet(updatedWallet);
  }

  async debitBonusWallet(userId: string, amount: number) {
    await this.expireCredits(userId);

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        credits: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    const availableBonus = wallet.credits
      .filter(
        (credit) =>
          credit.currency === "NGN" &&
          BONUS_CREDIT_TYPES.includes(credit.type as WalletCreditType),
      )
      .reduce(
        (sum, credit) =>
          sum + Math.max(0, credit.amount.toNumber() - credit.consumedAmount.toNumber()),
        0,
      );

    if (availableBonus < amount) {
      throw new BadRequestException("Insufficient bonus balance");
    }

    const breakdown: Array<{ type: WalletCreditType; amount: number }> = [];
    const updatedWallet = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: {
          availableNgn: {
            decrement: new Prisma.Decimal(amount),
          },
        },
      });

      let remaining = amount;
      for (const credit of wallet.credits.filter(
        (item) =>
          item.currency === "NGN" &&
          BONUS_CREDIT_TYPES.includes(item.type as WalletCreditType),
      )) {
        const usable = credit.amount.toNumber() - credit.consumedAmount.toNumber();
        if (usable <= 0) {
          continue;
        }

        const deduction = Math.min(usable, remaining);
        await tx.walletCredit.update({
          where: { id: credit.id },
          data: {
            consumedAmount: {
              increment: new Prisma.Decimal(deduction),
            },
          },
        });
        breakdown.push({ type: credit.type as WalletCreditType, amount: deduction });
        remaining -= deduction;

        if (remaining <= 0) {
          break;
        }
      }

      return tx.wallet.findUnique({
        where: { userId },
        include: {
          credits: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });

    if (!updatedWallet) {
      throw new NotFoundException("Wallet not found");
    }

    return {
      wallet: this.mapWallet(updatedWallet),
      breakdown,
    };
  }

  async removeCredit(userId: string, creditId: string) {
    await this.expireCredits(userId);

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        credits: true,
      },
    });
    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    const credit = wallet.credits.find((item) => item.id === creditId);
    if (!credit) {
      throw new NotFoundException("Bonus credit not found");
    }

    const available = Math.max(
      0,
      credit.amount.toNumber() - credit.consumedAmount.toNumber(),
    );

    const updatedWallet = await this.prisma.$transaction(async (tx) => {
      if (available > 0) {
        await tx.wallet.update({
          where: { userId },
          data: {
            [credit.currency === "NGN" ? "availableNgn" : "availableUsd"]: {
              decrement: new Prisma.Decimal(available),
            },
          },
        });
      }

      await tx.walletCredit.update({
        where: { id: creditId },
        data: {
          consumedAmount: credit.amount,
        },
      });

      return tx.wallet.findUnique({
        where: { userId },
        include: {
          credits: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });

    if (!updatedWallet) {
      throw new NotFoundException("Wallet not found");
    }

    return this.mapWallet(updatedWallet);
  }

  async expireCredits(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        credits: true,
      },
    });
    if (!wallet) {
      return;
    }

    const now = Date.now();
    const expiredCredits = wallet.credits.filter((credit) => {
      const available = credit.amount.toNumber() - credit.consumedAmount.toNumber();
      return available > 0 && new Date(credit.expiresAt).getTime() <= now;
    });

    if (expiredCredits.length === 0) {
      return;
    }

    let expiredNgn = 0;
    let expiredUsd = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const credit of expiredCredits) {
        const available = credit.amount.toNumber() - credit.consumedAmount.toNumber();
        if (credit.currency === "NGN") {
          expiredNgn += available;
        } else {
          expiredUsd += available;
        }

        await tx.walletCredit.update({
          where: { id: credit.id },
          data: {
            consumedAmount: credit.amount,
          },
        });
      }

      if (expiredNgn > 0 || expiredUsd > 0) {
        await tx.wallet.update({
          where: { userId },
          data: {
            availableNgn:
              expiredNgn > 0 ? { decrement: new Prisma.Decimal(expiredNgn) } : undefined,
            availableUsd:
              expiredUsd > 0 ? { decrement: new Prisma.Decimal(expiredUsd) } : undefined,
          },
        });
      }
    });
  }
}
