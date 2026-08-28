import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { CreateDepositDto } from "./dto/create-deposit.dto";
import { CreateWithdrawalDto } from "./dto/create-withdrawal.dto";
import { CreateBonusCashoutDto } from "./dto/create-bonus-cashout.dto";

@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post("deposit")
  createDeposit(@Body() payload: CreateDepositDto) {
    return this.transactionsService.createDeposit(payload);
  }

  @Post("withdrawal")
  createWithdrawal(@Body() payload: CreateWithdrawalDto) {
    return this.transactionsService.createWithdrawal(payload);
  }

  @Post("bonus-cashout")
  createBonusCashout(@Body() payload: CreateBonusCashoutDto) {
    return this.transactionsService.createBonusCashout(payload);
  }

  @Get()
  list(@Query("userId") userId?: string) {
    return userId
      ? this.transactionsService.listForUser(userId)
      : this.transactionsService.listAll();
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() body: { status: "CONFIRMED" | "REJECTED"; actorId: string; note?: string },
  ) {
    return this.transactionsService.updateStatus(id, body.status, body.actorId, body.note);
  }
}
