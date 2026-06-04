import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    status: true,
    kycStatus: true,
    kycDocumentType: true,
    kycDocumentUrl: true,
    kycAdminNote: true,
    kycSubmittedAt: true,
    kycReviewedAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private serializeUser(user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    kycStatus: string;
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

  async listUsers() {
    const users = await this.prisma.user.findMany({
      select: this.userSelect,
      orderBy: { createdAt: "desc" },
    });

    return users.map((user) => this.serializeUser(user));
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return this.serializeUser(user);
  }

  async search(query: string) {
    const normalized = query.trim();
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { id: { contains: normalized, mode: "insensitive" } },
          { email: { contains: normalized, mode: "insensitive" } },
          { fullName: { contains: normalized, mode: "insensitive" } },
        ],
      },
      select: this.userSelect,
      orderBy: { createdAt: "desc" },
    });

    return users.map((user) => this.serializeUser(user));
  }
}
