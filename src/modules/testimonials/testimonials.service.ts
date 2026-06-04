import { Injectable, NotFoundException } from "@nestjs/common";
import { Testimonial, TestimonialStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";

const DEFAULT_TESTIMONIALS = [
  {
    name: "Daniel E.",
    service: "Crypto payout",
    text: "Fast, reliable and trustworthy. My transactions are always successful and support is top-notch.",
    status: TestimonialStatus.APPROVED,
  },
  {
    name: "Mary A.",
    service: "Account funding",
    text: "I love how easy it is to fund my accounts and swap crypto. Best platform so far.",
    status: TestimonialStatus.APPROVED,
  },
  {
    name: "Kelvin O.",
    service: "Buy4Me delivery",
    text: "The exchange rates are the best I have found. Super transparent and very professional.",
    status: TestimonialStatus.APPROVED,
  },
  {
    name: "Blessing U.",
    service: "Crypto payout",
    text: "Fast payout and super clear updates all through.",
    status: TestimonialStatus.PENDING_REVIEW,
  },
] as const;

@Injectable()
export class TestimonialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private serialize(testimonial: Testimonial) {
    return {
      id: testimonial.id,
      name: testimonial.name,
      service: testimonial.service,
      text: testimonial.text,
      status: testimonial.status,
      submittedAt: testimonial.submittedAt.toISOString(),
      createdAt: testimonial.createdAt.toISOString(),
      updatedAt: testimonial.updatedAt.toISOString(),
    };
  }

  private async ensureSeeded() {
    const count = await this.prisma.testimonial.count();
    if (count > 0) {
      return;
    }

    await this.prisma.testimonial.createMany({
      data: DEFAULT_TESTIMONIALS.map((testimonial, index) => ({
        ...testimonial,
        submittedAt: new Date(Date.now() - index * 60 * 60 * 1000),
      })),
    });
  }

  private async clearCache() {
    await Promise.all([
      this.redis.delete("testimonials:all"),
      this.redis.delete("testimonials:approved"),
    ]);
  }

  async list(status?: TestimonialStatus) {
    await this.ensureSeeded();

    const cacheKey =
      status === TestimonialStatus.APPROVED
        ? "testimonials:approved"
        : status
          ? `testimonials:${status.toLowerCase()}`
          : "testimonials:all";
    const cached = await this.redis.getJson<Array<ReturnType<TestimonialsService["serialize"]>>>(
      cacheKey,
    );
    if (cached) {
      return cached;
    }

    const testimonials = await this.prisma.testimonial.findMany({
      where: status ? { status } : undefined,
      orderBy: { submittedAt: "desc" },
    });
    const serialized = testimonials.map((testimonial) => this.serialize(testimonial));
    await this.redis.setJson(cacheKey, serialized, 60);
    return serialized;
  }

  async updateStatus(id: string, status: TestimonialStatus) {
    const current = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException("Testimonial not found.");
    }

    const updated = await this.prisma.testimonial.update({
      where: { id },
      data: { status },
    });
    await this.clearCache();
    return this.serialize(updated);
  }
}
