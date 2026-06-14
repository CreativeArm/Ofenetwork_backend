import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { SupportTicket, SupportTicketPriority, SupportTicketStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { EmailService } from "../../infrastructure/email/email.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";

function clean(value: string) {
  return value.trim();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  private serialize(ticket: SupportTicket) {
    return {
      id: ticket.id,
      userId: ticket.userId,
      name: ticket.name,
      email: ticket.email,
      subject: ticket.subject,
      topic: ticket.topic,
      message: ticket.message,
      status: ticket.status,
      priority: ticket.priority,
      owner: ticket.owner,
      channel: ticket.channel,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
      conversation: [
        {
          sender: ticket.name,
          time: ticket.createdAt.toISOString(),
          text: ticket.message,
        },
      ],
    };
  }

  private inferPriority(topic: string, message: string): SupportTicketPriority {
    const combined = `${topic} ${message}`.toLowerCase();

    if (
      combined.includes("urgent") ||
      combined.includes("delay") ||
      combined.includes("withdrawal") ||
      combined.includes("missing") ||
      combined.includes("failed")
    ) {
      return SupportTicketPriority.HIGH;
    }

    if (
      combined.includes("deposit") ||
      combined.includes("buy4me") ||
      combined.includes("proof") ||
      combined.includes("payment")
    ) {
      return SupportTicketPriority.MEDIUM;
    }

    return SupportTicketPriority.LOW;
  }

  async create(payload: CreateSupportTicketDto) {
    const email = normalizeEmail(payload.email);
    const name = clean(payload.name);
    const topic = clean(payload.topic);
    const message = clean(payload.message);

    if (!name || !email || !topic || !message) {
      throw new BadRequestException("Please complete all required fields.");
    }

    const linkedUser = payload.userId
      ? await this.prisma.user.findUnique({ where: { id: payload.userId } })
      : await this.prisma.user.findUnique({ where: { email } });

    const subject = `${topic} support request`;
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId: linkedUser?.id,
        name,
        email,
        topic,
        subject,
        message,
        priority: this.inferPriority(topic, message),
      },
    });
    const serialized = this.serialize(ticket);

    await Promise.all([
      this.notificationsService.createForRole(
        UserRole.ADMIN,
        "New support request",
        `${name} submitted a ${topic.toLowerCase()} support request.`,
      ),
      this.emailService.sendSupportRequestEmail({
        ticketId: ticket.id,
        name,
        email,
        topic,
        message,
        createdAt: ticket.createdAt,
      }),
    ]);

    return {
      success: true,
      message: "Support request sent successfully. Our team will follow up shortly.",
      ticket: serialized,
    };
  }

  async list(status?: SupportTicketStatus) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: "desc" },
    });

    return tickets.map((ticket) => this.serialize(ticket));
  }

  async update(id: string, payload: UpdateSupportTicketDto) {
    const current = await this.prisma.supportTicket.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException("Support ticket not found.");
    }

    const nextStatus = payload.status ?? current.status;
    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: payload.status,
        owner: payload.owner ? clean(payload.owner) : undefined,
        priority: payload.priority,
        resolvedAt:
          nextStatus === SupportTicketStatus.RESOLVED
            ? current.resolvedAt ?? new Date()
            : nextStatus !== current.status
              ? null
              : undefined,
      },
    });

    return this.serialize(updated);
  }
}
