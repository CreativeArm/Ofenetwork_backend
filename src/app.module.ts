import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AppController } from "./app.controller";
import { AuthController } from "./modules/auth/auth.controller";
import { UsersController } from "./modules/users/users.controller";
import { TransactionsController } from "./modules/transactions/transactions.controller";
import { Buy4MeController } from "./modules/buy4me/buy4me.controller";
import { AdminController } from "./modules/admin/admin.controller";
import { NotificationsController } from "./modules/notifications/notifications.controller";
import { RatesController } from "./modules/rates/rates.controller";
import { TestimonialsController } from "./modules/testimonials/testimonials.controller";
import { WalletController } from "./modules/wallet/wallet.controller";
import { KycController } from "./modules/kyc/kyc.controller";
import { SupportController } from "./modules/support/support.controller";
import { AppService } from "./app.service";
import { PrismaService } from "./database/prisma.service";
import { RedisService } from "./infrastructure/redis/redis.service";
import { EmailService } from "./infrastructure/email/email.service";
import { AuthService } from "./modules/auth/auth.service";
import { UsersService } from "./modules/users/users.service";
import { WalletService } from "./modules/wallet/wallet.service";
import { TransactionsService } from "./modules/transactions/transactions.service";
import { NotificationsService } from "./modules/notifications/notifications.service";
import { Buy4MeService } from "./modules/buy4me/buy4me.service";
import { AdminService } from "./modules/admin/admin.service";
import { AuditService } from "./modules/audit/audit.service";
import { RatesService } from "./modules/rates/rates.service";
import { TestimonialsService } from "./modules/testimonials/testimonials.service";
import { KycService } from "./modules/kyc/kyc.service";
import { SupportService } from "./modules/support/support.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    TransactionsController,
    Buy4MeController,
    AdminController,
    RatesController,
    NotificationsController,
    TestimonialsController,
    WalletController,
    KycController,
    SupportController,
  ],
  providers: [
    AppService,
    PrismaService,
    RedisService,
    EmailService,
    AuthService,
    UsersService,
    WalletService,
    TransactionsService,
    NotificationsService,
    Buy4MeService,
    AdminService,
    AuditService,
    RatesService,
    TestimonialsService,
    KycService,
    SupportService,
  ],
})
export class AppModule {}
