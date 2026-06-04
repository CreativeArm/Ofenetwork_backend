import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ExchangeRate } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { CreateRateDto } from "./dto/create-rate.dto";
import { UpdateRateDto } from "./dto/update-rate.dto";

const DEFAULT_RATES = [
  { service: "Deriv", depositRate: "N1,650.00 / $1", withdrawalRate: "N1,720.00 / $1" },
  { service: "Crypto (USDT TRC20)", depositRate: "N1,580.00 / $1", withdrawalRate: "N1,680.00 / $1" },
  { service: "Skrill", depositRate: "N1,640.00 / $1", withdrawalRate: "N1,700.00 / $1" },
  { service: "PayPal", depositRate: "N1,650.00 / $1", withdrawalRate: "N1,720.00 / $1" },
  { service: "Venmo", depositRate: "N1,640.00 / $1", withdrawalRate: "N1,700.00 / $1" },
  { service: "Payoneer", depositRate: "N1,645.00 / $1", withdrawalRate: "N1,710.00 / $1" },
  { service: "Buy 4 Me", depositRate: "Custom Quote", withdrawalRate: "Custom Quote" },
] as const;

@Injectable()
export class RatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private serializeRate(rate: ExchangeRate) {
    return {
      id: rate.id,
      service: rate.service,
      depositRate: rate.depositRate,
      withdrawalRate: rate.withdrawalRate,
      sortOrder: rate.sortOrder,
      createdAt: rate.createdAt.toISOString(),
      updatedAt: rate.updatedAt.toISOString(),
    };
  }

  private async clearRateCache() {
    await Promise.all([
      this.redis.delete("rates:all"),
      this.redis.delete("admin:dashboard:metrics"),
    ]);
  }

  private async ensureSeeded() {
    const count = await this.prisma.exchangeRate.count();
    if (count > 0) {
      return;
    }

    await this.prisma.exchangeRate.createMany({
      data: DEFAULT_RATES.map((rate, index) => ({
        service: rate.service,
        depositRate: rate.depositRate,
        withdrawalRate: rate.withdrawalRate,
        sortOrder: index,
      })),
    });
  }

  async list() {
    const cached = await this.redis.getJson<
      Array<ReturnType<RatesService["serializeRate"]>>
    >("rates:all");
    if (cached) {
      return cached;
    }

    await this.ensureSeeded();
    const rates = await this.prisma.exchangeRate.findMany({
      orderBy: [{ sortOrder: "asc" }, { service: "asc" }],
    });
    const serialized = rates.map((rate) => this.serializeRate(rate));
    await this.redis.setJson("rates:all", serialized, 60);
    return serialized;
  }

  async create(payload: CreateRateDto) {
    const service = payload.service.trim();
    const depositRate = payload.depositRate.trim();
    const withdrawalRate = payload.withdrawalRate.trim();

    const existing = await this.prisma.exchangeRate.findUnique({
      where: { service },
    });
    if (existing) {
      throw new ConflictException("A rate already exists for this service.");
    }

    const sortOrder =
      payload.sortOrder ??
      ((await this.prisma.exchangeRate.aggregate({
        _max: { sortOrder: true },
      }))._max.sortOrder ?? -1) + 1;

    const rate = await this.prisma.exchangeRate.create({
      data: {
        service,
        depositRate,
        withdrawalRate,
        sortOrder,
      },
    });

    await this.clearRateCache();
    return this.serializeRate(rate);
  }

  async update(id: string, payload: UpdateRateDto) {
    const current = await this.prisma.exchangeRate.findUnique({
      where: { id },
    });
    if (!current) {
      throw new NotFoundException("Rate not found.");
    }

    const service = payload.service?.trim();
    if (service && service !== current.service) {
      const existing = await this.prisma.exchangeRate.findUnique({
        where: { service },
      });
      if (existing) {
        throw new ConflictException("A rate already exists for this service.");
      }
    }

    const rate = await this.prisma.exchangeRate.update({
      where: { id },
      data: {
        service: service ?? current.service,
        depositRate: payload.depositRate?.trim() ?? current.depositRate,
        withdrawalRate: payload.withdrawalRate?.trim() ?? current.withdrawalRate,
        sortOrder: payload.sortOrder ?? current.sortOrder,
      },
    });

    await this.clearRateCache();
    return this.serializeRate(rate);
  }

  async remove(id: string) {
    const current = await this.prisma.exchangeRate.findUnique({
      where: { id },
    });
    if (!current) {
      throw new NotFoundException("Rate not found.");
    }

    await this.prisma.exchangeRate.delete({
      where: { id },
    });

    await this.clearRateCache();
    return { success: true };
  }
}
