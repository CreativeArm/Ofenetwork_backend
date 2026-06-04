import { Controller, Get, Param } from "@nestjs/common";
import { WalletService } from "./wallet.service";

@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(":userId")
  getWallet(@Param("userId") userId: string) {
    return this.walletService.getWallet(userId);
  }
}
