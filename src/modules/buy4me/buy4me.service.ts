import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Buy4MeStatus, KycStatus, Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CreateBuy4MeDto } from "./dto/create-buy4me.dto";
import { PriceBuy4MeDto } from "./dto/price-buy4me.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../audit/audit.service";
import { SubmitBuy4MePaymentDto } from "./dto/submit-buy4me-payment.dto";
import { UpdateBuy4MeStatusDto } from "./dto/update-buy4me-status.dto";
import { CancelBuy4MeDto } from "./dto/cancel-buy4me.dto";
import { RedisService } from "../../infrastructure/redis/redis.service";

function defaultTimelineForStatus(status: Buy4MeStatus) {
  switch (status) {
    case "CANCELLED":
      return "Order cancelled. No payment is required for this request.";
    case "AWAITING_PAYMENT":
      return "Quote ready. Awaiting customer payment.";
    case "PAYMENT_SUBMITTED":
    case "PROCESSING":
      return "Payment submitted. Admin is confirming and preparing your order.";
    case "PURCHASING":
      return "Payment confirmed. Admin is purchasing your item.";
    case "SHIPPED":
      return "Your product has been purchased and shipped.";
    case "COMPLETED":
      return "Order delivered successfully.";
    case "ISSUE":
      return "There is an issue with this order. Admin will contact you.";
    default:
      return "Order status updated.";
  }
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

@Injectable()
export class Buy4MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
    private readonly redis: RedisService,
  ) {}

  private clearDashboardCache() {
    return this.redis.delete("admin:dashboard:metrics");
  }

  private serializeOrder(order: {
    id: string;
    userId: string;
    productLink: string;
    productDetails: string;
    productCost: Prisma.Decimal | null;
    shippingCost: Prisma.Decimal | null;
    serviceCharge: Prisma.Decimal | null;
    totalCost: Prisma.Decimal | null;
    paymentMethod: string | null;
    proofOfPaymentUrl: string | null;
    timelineUpdate: string | null;
    adminNote: string | null;
    status: Buy4MeStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: order.id,
      userId: order.userId,
      productLink: order.productLink,
      productDetails: order.productDetails,
      productCost: order.productCost?.toNumber(),
      shippingCost: order.shippingCost?.toNumber(),
      serviceCharge: order.serviceCharge?.toNumber(),
      totalCost: order.totalCost?.toNumber(),
      paymentMethod: order.paymentMethod ?? undefined,
      proofOfPaymentUrl: order.proofOfPaymentUrl ?? undefined,
      timelineUpdate: order.timelineUpdate ?? undefined,
      adminNote: order.adminNote ?? undefined,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
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
        "KYC verification is required before you can use Buy4Me.",
      );
    }
  }

  async createOrder(payload: CreateBuy4MeDto) {
    await this.ensureKycApproved(payload.userId);
    const order = await this.prisma.buy4MeOrder.create({
      data: {
        userId: payload.userId,
        productLink: payload.productLink,
        productDetails: payload.productDetails.trim(),
        status: "PROCESSING",
        timelineUpdate: "Request submitted. Admin review in progress.",
        adminNote: "Awaiting pricing review from admin.",
      },
    });
    await this.notificationsService.create(
      payload.userId,
      "Buy4Me request submitted",
      "Your Buy4Me request is now processing for admin review.",
    );
    await this.notificationsService.createForRole(
      UserRole.ADMIN,
      "New Buy4Me request",
      `A new Buy4Me request has been submitted by user ${payload.userId}.`,
    );
    await this.auditService.log(payload.userId, "CREATED", "buy4me", order.id, {
      productLink: payload.productLink,
    });
    await this.clearDashboardCache();
    return this.serializeOrder(order);
  }

  async listOrders(userId?: string) {
    const orders = await this.prisma.buy4MeOrder.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => this.serializeOrder(order));
  }

  async priceOrder(orderId: string, payload: PriceBuy4MeDto) {
    const order = await this.prisma.buy4MeOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const totalCost =
      payload.productCost + payload.shippingCost + payload.serviceCharge;
    const updatedOrder = await this.prisma.buy4MeOrder.update({
      where: { id: orderId },
      data: {
        productCost: new Prisma.Decimal(payload.productCost),
        shippingCost: new Prisma.Decimal(payload.shippingCost),
        serviceCharge: new Prisma.Decimal(payload.serviceCharge),
        totalCost: new Prisma.Decimal(totalCost),
        status: "AWAITING_PAYMENT",
        timelineUpdate: "Quote ready. Awaiting customer payment.",
        adminNote: "Pricing has been confirmed and sent to the customer.",
      },
    });

    await this.notificationsService.create(
      order.userId,
      "Buy4Me quote ready",
      `Your Buy4Me order total is ${formatNaira(totalCost)}. Payment is now required to continue.`,
    );
    await this.auditService.log(payload.actorId, "PRICED", "buy4me", order.id, {
      totalCost,
    });
    await this.clearDashboardCache();
    return this.serializeOrder(updatedOrder);
  }

  async submitPayment(orderId: string, payload: SubmitBuy4MePaymentDto) {
    const order = await this.prisma.buy4MeOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    await this.ensureKycApproved(order.userId);

    const updatedOrder = await this.prisma.buy4MeOrder.update({
      where: { id: orderId },
      data: {
        paymentMethod: payload.paymentMethod.trim(),
        proofOfPaymentUrl: payload.proofOfPaymentUrl?.trim() || null,
        status: "PROCESSING",
        timelineUpdate: "Payment submitted. Admin is confirming and preparing your order.",
        adminNote:
          "Customer has uploaded payment proof for verification. Order moved back into processing.",
      },
    });

    await this.notificationsService.create(
      order.userId,
      "Buy4Me payment submitted",
      "Your Buy4Me payment proof has been sent to admin for confirmation.",
    );
    await this.notificationsService.createForRole(
      UserRole.ADMIN,
      "Buy4Me payment submitted",
      `Payment proof has been uploaded for Buy4Me order ${order.id}.`,
    );
    await this.clearDashboardCache();

    return this.serializeOrder(updatedOrder);
  }

  async cancelOrder(orderId: string, payload: CancelBuy4MeDto = {}) {
    const order = await this.prisma.buy4MeOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const reason = payload.reason?.trim();
    const updatedOrder = await this.prisma.buy4MeOrder.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        timelineUpdate: reason
          ? `Order cancelled by customer: ${reason}`
          : "Order cancelled by customer.",
        adminNote: reason
          ? `Customer cancelled after quote review. Reason: ${reason}`
          : "Customer cancelled after quote review.",
      },
    });

    await this.notificationsService.create(
      order.userId,
      "Buy4Me order cancelled",
      "Your Buy4Me request has been cancelled.",
    );
    await this.notificationsService.createForRole(
      UserRole.ADMIN,
      "Buy4Me order cancelled",
      `Customer cancelled Buy4Me order ${order.id}.`,
    );
    await this.auditService.log(order.userId, "CANCELLED", "buy4me", order.id, {
      reason,
    });
    await this.clearDashboardCache();

    return this.serializeOrder(updatedOrder);
  }

  async updateStatus(orderId: string, payload: UpdateBuy4MeStatusDto) {
    const order = await this.prisma.buy4MeOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (payload.status === "AWAITING_PAYMENT" && !order.totalCost) {
      throw new BadRequestException(
        "Add product cost, shipping cost, and service charge before requesting customer payment.",
      );
    }

    const updatedOrder = await this.prisma.buy4MeOrder.update({
      where: { id: orderId },
      data: {
        status: payload.status,
        timelineUpdate:
          payload.timelineUpdate?.trim() ||
          defaultTimelineForStatus(payload.status),
        adminNote: payload.adminNote?.trim() || order.adminNote,
      },
    });

    await this.notificationsService.create(
      order.userId,
      `Buy4Me ${payload.status.toLowerCase().replace(/_/g, " ")}`,
      payload.timelineUpdate?.trim() ||
        `Your Buy4Me order is now ${payload.status.toLowerCase().replace(/_/g, " ")}.`,
    );
    await this.auditService.log(payload.actorId, payload.status, "buy4me", order.id, {
      timelineUpdate: payload.timelineUpdate,
      adminNote: payload.adminNote,
    });
    await this.clearDashboardCache();

    return this.serializeOrder(updatedOrder);
  }

  async completeOrder(orderId: string, actorId: string) {
    return this.updateStatus(orderId, {
      actorId,
      status: "COMPLETED",
      timelineUpdate: "Order completed and ready for customer handoff.",
      adminNote: "Buy4Me order marked as completed.",
    });
  }
}
