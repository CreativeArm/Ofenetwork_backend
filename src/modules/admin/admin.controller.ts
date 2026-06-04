import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  @Get("search-users")
  searchUsers(@Query("query") query: string) {
    return this.adminService.searchUsers(query);
  }

  @Post("wallet-credit")
  creditWallet(
    @Body()
    body: {
      actorId: string;
      userId: string;
      amount: number;
      currency: "NGN" | "USD";
      type:
        | "ADMIN_CREDIT"
        | "PROMOTIONAL_BONUS"
        | "REFERRAL_BONUS"
        | "THRESHOLD_BONUS"
        | "CASHBACK";
    },
  ) {
    return this.adminService.creditWallet(body);
  }

  @Delete("users/:userId/bonus/:creditId")
  removeBonus(
    @Param("userId") userId: string,
    @Param("creditId") creditId: string,
    @Body() body: { actorId: string },
  ) {
    return this.adminService.removeBonus({
      actorId: body.actorId,
      userId,
      creditId,
    });
  }
}
