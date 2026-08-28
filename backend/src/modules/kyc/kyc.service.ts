import { Injectable, NotFoundException } from "@nestjs/common";
import { KycStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { SubmitKycDto } from "./dto/submit-kyc.dto";
import { UpdateKycStatusDto } from "./dto/update-kyc-status.dto";

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  private serializeUser(user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    kycStatus: KycStatus;
    kycDocumentType: string | null;
    kycDocumentUrl: string | null;
    kycAdminNote: string | null;
    kycSubmittedAt: Date | null;
    kycReviewedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      kycStatus: user.kycStatus,
      kycDocumentType: user.kycDocumentType ?? undefined,
      kycDocumentUrl: user.kycDocumentUrl ?? undefined,
      kycAdminNote: user.kycAdminNote ?? undefined,
      kycSubmittedAt: user.kycSubmittedAt?.toISOString(),
      kycReviewedAt: user.kycReviewedAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private async clearCaches() {
    await Promise.all([
      this.redis.delete("admin:dashboard:metrics"),
      this.redis.delete("admin:user-search:"),
    ]);
  }

  async submit(payload: SubmitKycDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: payload.userId },
      data: {
        kycStatus: KycStatus.PENDING,
        kycDocumentType: payload.documentType.trim(),
        kycDocumentUrl: payload.documentUrl.trim(),
        kycAdminNote: payload.notes?.trim() || null,
        kycSubmittedAt: new Date(),
        kycReviewedAt: null,
      },
    });

    await this.notificationsService.create(
      payload.userId,
      "KYC submitted",
      "Your KYC document has been submitted and is waiting for admin review.",
    );
    await this.notificationsService.createForRole(
      UserRole.ADMIN,
      "New KYC submission",
      `${user.fullName} submitted KYC documents for review.`,
    );
    await this.auditService.log(payload.userId, "KYC_SUBMITTED", "user", payload.userId, {
      documentType: payload.documentType,
    });
    await this.clearCaches();

    return this.serializeUser(updatedUser);
  }

  async updateStatus(userId: string, payload: UpdateKycStatusDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const nextStatus = payload.status;
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: nextStatus,
        kycAdminNote: payload.note?.trim() || null,
        kycReviewedAt:
          nextStatus === KycStatus.APPROVED || nextStatus === KycStatus.REJECTED
            ? new Date()
            : null,
      },
    });

    const humanStatus = nextStatus.toLowerCase().replace(/_/g, " ");
    await this.notificationsService.create(
      userId,
      `KYC ${humanStatus}`,
      payload.note?.trim() ||
        `Your KYC verification status is now ${humanStatus}.`,
    );
    await this.auditService.log(payload.actorId, `KYC_${nextStatus}`, "user", userId, {
      note: payload.note,
    });
    await this.clearCaches();

    return this.serializeUser(updatedUser);
  }
}
