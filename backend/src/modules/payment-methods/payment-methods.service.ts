import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

const DEFAULT_PAYMENT_METHODS = [
  {
    channel: "Bank Transfer",
    details: "Kuda Microfinance Bank | Ofenetworks Solutions NG LTD | 3003193472 | Narration: payment for chicken feeds",
    usage: "All deposits",
    status: "Primary",
  },
  {
    channel: "USDT TRC20",
    details: "Network: Tron (TRC20) | Wallet: TJLZtrdyxUuE96zwj687S63Z2zVes8in73",
    usage: "Crypto deposits and withdrawals",
    status: "Active",
  },
  {
    channel: "Zelle",
    details: "Account Number / Phone: +12673998390 | Name on Account: Olaoluwa Oladele",
    usage: "Zelle deposits and withdrawals",
    status: "Active",
  },
] as const;

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    await Promise.all(
      DEFAULT_PAYMENT_METHODS.map((method, sortOrder) =>
        this.prisma.paymentMethod.upsert({
          where: { channel: method.channel },
          update: {},
          create: { ...method, sortOrder },
        }),
      ),
    );

    return this.prisma.paymentMethod.findMany({
      orderBy: [{ sortOrder: "asc" }, { channel: "asc" }],
    });
  }
}
