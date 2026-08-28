import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeNotification(notification: {
    id: string;
    userId: string;
    title: string;
    message: string;
    createdAt: Date;
    readAt: Date | null;
  }) {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt.toISOString(),
      read: Boolean(notification.readAt),
      readAt: notification.readAt?.toISOString() ?? null,
    };
  }

  async create(userId: string, title: string, message: string) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    return this.serializeNotification(notification);
  }

  async createForRole(role: UserRole, title: string, message: string) {
    const users = await this.prisma.user.findMany({
      where: {
        role,
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

    if (users.length === 0) {
      return [];
    }

    await this.prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        title,
        message,
      })),
    });

    return users.map((user) => ({
      userId: user.id,
      title,
      message,
    }));
  }

  async listForUser(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: "desc" },
    });

    return notifications.map((notification) => this.serializeNotification(notification));
  }

  async markAsRead(id: string) {
    const current = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException("Notification not found");
    }

    const notification = await this.prisma.notification.update({
      where: { id },
      data: {
        readAt: current.readAt ?? new Date(),
      },
    });

    return this.serializeNotification(notification);
  }
}
