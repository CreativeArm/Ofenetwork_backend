import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeAuditLog(entry: {
    id: string;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: unknown;
    createdAt: Date;
  }) {
    return {
      id: entry.id,
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata ?? undefined,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  async log(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ) {
    const entry = await this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });

    return this.serializeAuditLog(entry);
  }

  async list() {
    const entries = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
    });

    return entries.map((entry) => this.serializeAuditLog(entry));
  }
}
